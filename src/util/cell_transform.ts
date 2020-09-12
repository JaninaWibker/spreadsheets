import { generate_id_format } from './cell_id'
import { lookup, destructure, default_value, is_formula, parse_formula } from './helpers'
import type { Cell, CellId } from '../types/Spreadsheet'
import { CellType } from '../types/CellTypes'

type LibType = any // TODO: can this be specified **a little bit** further without making requirements for what the standard library actually is (it is purposefully injected and not imported to be environment agnostic; using object or { [key: string]: any } does not work, it being a mapping from strings to either functions or numbers is what the type should describe)

export type getCellCurried = (target: string, call_cell: CellId, byRender: boolean | undefined, rec_call_cell: CellId) => string | number | undefined
export type getCell = (lib: LibType, data: Cell[][], identifier_cells: { [key: string]: CellId; }) => getCellCurried

// target is the cell for which the value should be returned
// call_cell is the cell that initiated the whole recursive descend
// byRender skips a check for circular calls as the caller (usually identified by call_cell) is not an actual cell but the renderer
// rec_call_cell is the direct caller; meaning the target of the call one stack frame lower on the call stack
const get_cell = (lib: LibType, data: Cell[][], identifier_cells: { [key: string]: CellId }) => (target: string, call_cell: CellId, byRender=false, rec_call_cell: CellId) => {
  // console.log(cell, call_cell, byRender, rec_call_cell)

  const pair = lookup(target, identifier_cells)

  if(!pair) {
    throw Error('not a valid Cell (named cell not defined or mistakenly identified as identifier (if this is what happened, you probably have an error in your selector))')
  }

  const [c_row, c_col] = pair
  const cell = data[c_row][c_col]

  const [rc_row, rc_col] = rec_call_cell
  const rcc = data[rc_row][rc_col]

  if(cell === undefined) {
    console.log(target, call_cell, cell)
    return '<error>'
  }

  if(cell.tp === CellType.EMPTY) return ''
  if(cell.tp === CellType.NUMBER || cell.tp === CellType.STRING) {

    // add 'changes'-array to the current cell including the caller of g (the previous function in the callstack, (and the cell of this function))
    // if the array does exist already, the id of the cell is just pushed to it
    if(c_row !== rc_row || c_col !== rc_col) {
      console.log('caller', rcc, 'current', cell)

      // if(Array.isArray(cell.changes) && !cell.changes.includes(rcc.id)) { // TODO: this technically needs to be more sophisticated now as ids aren't just strings anymore but this code will be removed soon so it shouldn't really matter
      //   // c.changes.push(rcc._id)
      // }


      console.log(destructure(rcc, ['id', 'changes', 'visited']), destructure(cell, ['id', 'changes', 'visited']))
    }

    if(!cell.fn) return cell.vl
    if(cell.fn) {
      // if already calculated then add visited = true, else check if it is a circular call and if it is
      // return the default value for this data type, else calculate the value by executing the function
      if(cell.visited === false) {
        if(c_row !== call_cell[0] || c_col !== call_cell[1] || byRender) {
          console.log(cell.id, rcc.id)
          cell._vl = cell.fn((id: string) => get_cell(lib, data, identifier_cells)(id, call_cell, false, cell._id), lib) // TODO: this might need to change when `g` changes
        } else {
          cell._vl = cell.vl || default_value(cell.tp)
        }
      }

      cell.visited = true

      return cell._vl
    }
  } else return cell.vl
}

const recurse = (lib: LibType, data: Cell[][], identifier_cells: { [key: string]: CellId }, cell: Cell, origin_cell: CellId) => {
  if(cell.visited) return // already visited; no need to recalculate _vl and do recursing again
  console.log('calling recurse for ' + generate_id_format(cell._id))
  cell.refs.forEach(ref_id => {
    if(origin_cell[0] === ref_id[0] && origin_cell[1] === ref_id[1]) {
      // recursive data structure / circular references (TODO: does this really catch all recursive data structures?; i don't really think this catches everything :/)
      throw new Error("circular references")
    }
    console.log(ref_id, data[ref_id[0]])
    const ref = data[ref_id[0]][ref_id[1]]
    ref.changes.push(cell._id)
    if(ref.visited) return // already visited this ref; no need to recalcualte _vl and recurse further
    recurse(lib, data, identifier_cells, ref, origin_cell)
    if(ref.fn) {
      ref._vl = ref.fn((cell_id: string) => (get_cell(lib, data, identifier_cells)(cell_id, ref._id, false, origin_cell)), lib)
      console.log('calculated value for cell ' + generate_id_format(ref._id) + ' (' + ref._vl + ')')
    }
  })
  if(cell.fn) {
    cell._vl = cell.fn((cell_id: string) => (get_cell(lib, data, identifier_cells)(cell_id, cell._id, false, origin_cell)), lib)
    console.log('calculated value for cell ' + generate_id_format(cell._id) + ' (' + cell._vl + ')')
  }
  cell.visited = true
}

const parse_formulas = (identifier_cells: { [key: string]: CellId }, cell: Cell) => {
  if(cell.name) {
    identifier_cells[cell.name] = cell._id // TODO: should this be CellId or Cell?
  }

  const {fn, refs} = (is_formula(cell) && parse_formula((cell.vl as string).substring(1))) || { fn: undefined, refs: [] }

  return { ...cell, fn, refs }
}

const descend = (lib: LibType, data: Cell[][], identifier_cells: { [key: string]: CellId }, cell: Cell) => {
  cell.refs = cell.refs.map((ref: CellId) => typeof(ref) === 'string' ? lookup(ref, identifier_cells) : ref) as CellId[] // transform all refs into the [col, row] format
  console.warn(cell)
  if(cell.refs.find((ref: CellId) => ref[0] === cell.row && ref[1] === cell.col)) {
    cell.err = new Error("self-references not allowed")
  } else {
    console.log('-- recurse --')
    recurse(lib, data, identifier_cells, cell, cell._id)
  }
  return cell
}

const transform = (lib: LibType, data: Cell[][], identifier_cells: { [key: string]: CellId }) => {

  const new_data = data
    .map((row, _i)               => row.map(cell => parse_formulas(identifier_cells, cell)))
    .map((row, _i, current_data) => row.map(cell => descend(lib, current_data, identifier_cells, cell)))
    .map((row)                   => row.map(cell => ({...cell, visited: false})))

  console.log("transformed", new_data)

  return new_data
}

export default {
  get_cell,
  recurse,
  parse_formulas,
  descend,
  transform,
}

export {
  get_cell,
  recurse,
  parse_formulas,
  descend,
  transform,
}