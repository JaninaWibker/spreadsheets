import { generate_id_format } from './cell_id'
import { lookup, destructure, default_value, is_formula, parse_formula, cell_to_json_replacer, compare_cell_ids } from './helpers'
import type { Cell, CellId, Spreadsheet } from '../types/Spreadsheet'
import { CellType } from '../types/CellTypes'
import { get_cycles, find_cycle_starting_from_node } from './cycle_detection'

class CircularReferenceError extends Error {  }
class TransitiveError extends Error {  }

type LibType = any // TODO: can this be specified **a little bit** further without making requirements for what the standard library actually is (it is purposefully injected and not imported to be environment agnostic; using object or { [key: string]: any } does not work, it being a mapping from strings to either functions or numbers is what the type should describe)

export type getCellCurried = (target: string, call_cell: CellId, byRender: boolean | undefined, rec_call_cell: CellId) => string | number
export type getCell = (lib: LibType, data: Cell[][], identifier_cells: { [key: string]: CellId; }) => getCellCurried

// target is the cell for which the value should be returned
// call_cell is the cell that initiated the whole recursive descend
// byRender skips a check for circular calls as the caller (usually identified by call_cell) is not an actual cell but the renderer
// rec_call_cell is the direct caller; meaning the target of the call one stack frame lower on the call stack
const get_cell = (lib: LibType, spreadsheet: Pick<Spreadsheet, 'data' | 'identifier_cells'>) => {

  const inner_get_cell_raw = (target: string, call_cell: CellId, byRender=false, rec_call_cell: CellId): string | number => {
    // console.log(cell, call_cell, byRender, rec_call_cell)

    const pair = lookup(target, spreadsheet.identifier_cells)

    if(!pair) {
      throw Error('not a valid Cell (named cell not defined or mistakenly identified as identifier (if this is what happened, you probably have an error in your selector))')
    }

    const [c_row, c_col] = pair
    const cell = spreadsheet.data[c_row][c_col]

    const [rc_row, rc_col] = rec_call_cell
    const rcc = spreadsheet.data[rc_row][rc_col]

    if(cell === undefined) {
      console.log(target, call_cell, cell)
      throw new Error('#Cell not found') // TODO: ???: shouldn't this be done somewhat better
    }

    if(cell.tp === CellType.EMPTY) return ''
    if(cell.tp === CellType.NUMBER || cell.tp === CellType.STRING) {

      // add 'changes'-array to the current cell including the caller of g (the previous function in the callstack, (and the cell of this function))
      // if the array does exist already, the id of the cell is just pushed to it
      if(c_row !== rc_row || c_col !== rc_col) {
        console.log('caller', rcc, 'current', cell)
        console.log(destructure(rcc, ['id', 'changes', 'visited']), destructure(cell, ['id', 'changes', 'visited']))
      }

      if(cell.cycle.length > 0) throw new CircularReferenceError('#Circular reference')
      if(cell.err !== undefined && cell.err instanceof TransitiveError) cell.err = undefined // ignore transitive errors // TODO: correct?
      if(cell.err !== undefined) throw cell.err
      if(cell.fn) {
        // if already calculated then add visited = true, else check if it is a circular call and if it is
        // return the default value for this data type, else calculate the value by executing the function
        if(cell.visited === false) {
          if(c_row !== call_cell[0] || c_col !== call_cell[1] || byRender) {
            console.log(cell.id, rcc.id)
            try {
              cell._vl = cell.fn((id: string) => inner_get_cell_raw(id, call_cell, false, cell._id), lib) // TODO: this might need to change when `g` changes
            } catch(err) {
              console.log('error was thrown')
              cell.err = new TransitiveError('#Transitive error')
              throw err
            }
          } else {
            cell._vl = cell.vl || default_value(cell.tp)
          }
        }

        cell.visited = true

        return cell._vl
      } else { // if(!cell.fn) { ... }
        return cell.vl
      }
    } else return cell.vl
  }


  return (target: string, call_cell: CellId, byRender=false, rec_call_cell: CellId): string | number => {
    try {
      return inner_get_cell_raw(target, call_cell, byRender, rec_call_cell)
    } catch(err) {
      const [row, col] = lookup(target, spreadsheet.identifier_cells) as CellId
      const cell = spreadsheet.data[row][col]
      if(err instanceof CircularReferenceError && cell.cycle.length > 0) {
        // don't modify cell.err in any way because circular errors are already handled via the cycle array
        const source_str = generate_id_format(call_cell)
        const target_str = generate_id_format(lookup(target, spreadsheet.identifier_cells) as CellId)
        if(source_str !== target_str) console.log(`caught circular reference error (${source_str} queried ${target_str})`)
        return 0 // TODO: probably should return something else here
      } else {
        cell.err = new Error('#Transitive error')
        return 0 // TODO: probably should return something else here
      }
    }
  }
}

const recurse = (lib: LibType, spreadsheet: Pick<Spreadsheet, 'data' | 'identifier_cells'>, cell: Cell, origin_cell: CellId) => {
  if(cell.visited) return // already visited; no need to recalculate _vl and do recursing again
  if(cell.cycle.length > 0) {
    cell.visited = true
    return
  }
  console.log('calling recurse for ' + generate_id_format(cell._id))
  cell.refs.forEach(ref_id => {
    console.log(ref_id, spreadsheet.data[ref_id[0]])
    const ref = spreadsheet.data[ref_id[0]][ref_id[1]]
    if(ref.visited) return // already visited this ref; no need to recalcualte _vl and recurse further
    if(ref.cycle.length > 0) return // if a circular datastructure is detected an error is added. This stops all further recursion at that point
    recurse(lib, spreadsheet, ref, origin_cell)
    if(ref.fn) {
      ref._vl = ref.fn((cell_id: string) => (get_cell(lib, spreadsheet)(cell_id, ref._id, false, origin_cell)), lib)
      console.log('calculated value for cell ' + generate_id_format(ref._id) + ' (' + ref._vl + ')')
      const maybe_err = check_errors(ref)
      if(maybe_err !== undefined) ref.err = maybe_err
    }
  })
  if(cell.fn && cell.cycle.length === 0) {
    cell._vl = cell.fn((cell_id: string) => (get_cell(lib, spreadsheet)(cell_id, cell._id, false, origin_cell)), lib)

    console.log('calculated value for cell ' + generate_id_format(cell._id) + ' (' + cell._vl + ')')
    const maybe_err = check_errors(cell)
    if(maybe_err !== undefined) cell.err = maybe_err
  }
  cell.visited = true
}

const parse_formulas = (identifier_cells: { [key: string]: CellId }, cell: Cell) => {
  if(cell.name) {
    identifier_cells[cell.name] = cell._id
  }

  const {fn, refs: raw_refs} = (is_formula(cell) && parse_formula((cell.vl as string).substring(1))) || { fn: undefined, refs: [] }

  const refs = raw_refs.map(ref => typeof(ref) === 'string' ? lookup(ref, identifier_cells) : ref) as CellId[]

  return { ...cell, fn, refs }
}

const descend = (lib: LibType, spreadsheet: Pick<Spreadsheet, 'data' | 'identifier_cells'>, cell: Cell) => {
  cell.refs = cell.refs.map((ref: CellId) => typeof(ref) === 'string' ? lookup(ref, spreadsheet.identifier_cells) : ref) as CellId[] // transform all refs into the [col, row] format
  console.warn(cell)
  console.log('-- recurse --')
  recurse(lib, spreadsheet, cell, cell._id)
  return cell
}

const check_errors = (cell: Cell): Error | undefined => {
  switch(cell.tp) {
    case CellType.NUMBER: {
      if(typeof(cell._vl) !== "number" || isNaN(cell._vl)) {
        return new Error('#NaN')
      }
    } break;
    case CellType.STRING: {
      // strings pretty much accept anything; no need to do anything here
    } break;
    case CellType.EMPTY: {
      if(!cell._vl) {
        return new Error('empty cell but somehow has a value')
      }
    } break;

    default: {
      throw new Error(`handle additional cell type ${cell.tp}.\n\n> the given cell looked like this:\n${JSON.stringify(cell, cell_to_json_replacer, 2)}`)
    }
  }
}

const compute_nodes_and_edges = (data: Cell[][]) => {
  const find_index_by_cell_id = (nodes: Cell[], [row, col]: CellId): number => nodes.findIndex(node => compare_cell_ids(node._id, [row, col]))

  const nodes: Cell[] = data.flat()
  const edges: { [key: number]: number[]} = Object.fromEntries(nodes
    .map(node => node.refs.map(id => find_index_by_cell_id(nodes, id)))
    .map((cell, i) => [i, cell])
  )
  return { nodes, edges}
}

const check_circular_for_cell = (data: Cell[][], cell: Cell): Cell[][] | null => {

  const { edges } = compute_nodes_and_edges(data)

  const node_num = cell._id[0] * data[cell._id[0]].length + cell._id[1]

  const cycle = find_cycle_starting_from_node(edges, node_num)

  // this makes the assumption that every row has the same number of cells. This is basically a given but
  // still something that MAY need to be considered some time in the future. This also assumes that at
  // least one row exists but this is also given because otherwise no single cell would be able to exist
  const actual_ids = cycle.map(id => [Math.floor(id / data[0].length), id % data[0].length]) as CellId[]

  actual_ids.forEach(([row, col]) => {
    const cell = data[row][col]
    cell.cycle = actual_ids
  })

  return data
}

const check_circular = (data: Cell[][]): Cell[][] => {

  const { nodes, edges } = compute_nodes_and_edges(data)

  const cycles = get_cycles(nodes, edges)

  const affected_cells = cycles.filter(cycle => cycle.length > 1 || cycle[0].refs.find(cell_id => compare_cell_ids(cell_id, cycle[0]._id)))

  affected_cells.forEach(cycle => cycle.forEach(cell => {
    cell.cycle = cycle.map(cell => cell._id)
  }))

  if(affected_cells.length > 0) console.log('cycle', affected_cells)

  return data
}

const compute_changes = (data: Cell[][]) => {

  const get_cell_by_id = (cell_id: CellId): Cell => data
    .map(row => row.find(cell => compare_cell_ids(cell._id, cell_id)))
    .find(cell => !!cell) as Cell

  for(let row = 0; row < data.length; row++) {
    for(let col = 0; col < data[row].length; col++) {
      const cell = data[row][col]
      cell.refs.map(get_cell_by_id).forEach(ref => ref.changes.push(cell._id))
    }
  }
  console.log('cycle', data)
  return data
}


const transform = (lib: LibType, spreadsheet: Spreadsheet): Spreadsheet['data'] => {

  const new_data = compute_changes(check_circular(spreadsheet.data
    .map((row, _i)               => row.map(cell => parse_formulas(spreadsheet.identifier_cells, cell)))
  ))
    .map((row, _i, current_data) => row.map(cell => descend(lib, { data: current_data, identifier_cells: spreadsheet.identifier_cells }, cell)))
    .map((row)                   => row.map(cell => ({...cell, visited: false})))

  console.log("transformed", new_data)

  return new_data
}

const transform_spreadsheet = (lib: LibType, spreadsheet: Spreadsheet): Spreadsheet => ({
  ...spreadsheet,
  data: transform(lib, spreadsheet)
})

export default {
  get_cell,
  recurse,
  parse_formulas,
  descend,
  transform,
  transform_spreadsheet,
  check_errors,
  check_circular_for_cell,
}

export {
  get_cell,
  recurse,
  parse_formulas,
  descend,
  transform,
  transform_spreadsheet,
  check_errors,
  check_circular_for_cell,
}
