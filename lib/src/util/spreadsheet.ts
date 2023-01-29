import { parse_formula, lookup, compute_additions_and_deletions, compare_cell_ids } from './helpers'
import { generate_id_format } from './cell_id'
import { get_cell, check_errors, check_circular_for_cell } from './cell_transform'
import { CellType } from '../types/CellTypes'
import type { Cell, CellId, Spreadsheet } from '../types/Spreadsheet'

import { lib } from './stdlib'

const change_cell_types = (spreadsheet: Spreadsheet, cells: CellId[][], type: CellType) => {
  cells.forEach(row => row.forEach(([row, col]) => {
    const cell = spreadsheet.data[row][col]
    const old_type = cell.tp
    cell.tp = type
    cell.stp = undefined

    if (old_type === CellType.EMPTY) {
      switch (type) {
        case CellType.NUMBER: cell.vl = 0; break
        case CellType.STRING: cell.vl = ''; break
        case CellType.EMPTY: break
        default: throw new Error('forgot to add new case to switch statement')
      }
    }
  }))
}

const update = (spreadsheet: Spreadsheet, cell_id: CellId) => {
  const [col, row] = cell_id
  const cell = spreadsheet.data[col][row]

  // mark cell as not visited, meaning invalidate its 'cache'
  // this gets picked up by get_cell which will then recompute the value of the cell
  spreadsheet.data[col][row].visited = false

  if (cell.changes) {
    cell.changes // filter out cells which are also in the same cycle as the current cell // TODO: does this filter out too much?; should they be updated at least once?
      .filter(cell_id => !cell.cycle.find(cell_id_cycle => compare_cell_ids(cell_id, cell_id_cycle)))
      .forEach(cell_id => update(spreadsheet, cell_id))
  }
}

const handleCellChange = (spreadsheet: Spreadsheet, cell: Cell, value: string) => {
  const [row, col] = cell._id

  if (cell.name) {
    spreadsheet.identifier_cells[cell.name] = cell._id
  }

  // nothing has changed (this check only works if vl is a string; numbers are explicitly checked again later on)
  if (value === cell.vl) return

  // TODO: why is spreadsheet.data[row][col] used and not just cell? Is cell just a copy?

  // used to compute which cells need to have their changes array updated
  const old_refs = cell.refs
  const old_cycle = [...cell.cycle]

  cell.err = undefined // resetting error; if it still exists it's going to get recomputed
  cell.cycle = []

  // if formula then assign new value to .vl and compute .fn
  if (value.startsWith('=')) {
    const { fn, refs: raw_refs } = parse_formula(value.substring(1))!
    cell.vl = value
    cell.fn = fn
    cell.refs = raw_refs.map(ref => typeof ref === 'string' ? lookup(ref, spreadsheet.identifier_cells) : ref) as CellId[]
  } else {
    if (cell.tp === CellType.NUMBER) {
      cell.fn = undefined
      cell.refs = []
      cell.err = undefined
      cell.changes = cell.changes.filter(cell_id => !compare_cell_ids(cell._id, cell_id)) // incase of self reference remove entry from changes array
      // don't reset cycle just yet, this would mean also recomputing the changes array for other cells; this is already done further down the chain
      const parsed_value = parseFloat(value)
      if (isNaN(parsed_value)) {
        console.log(cell)
        // TODO: what should happen here? this is what gets run if the value that is inputted is not a
        // TODO: number, but should the error be generated here or somewhere else; considering that no
        // TODO: other input is ever somehow flagged as invalid (you can perfectly well place strings
        // TODO: in a NUMBER cell using a reference) should this even be an error? I feel like there
        // TODO: should be stronger safe-guards against this and errors should be displayed using the
        // TODO: same mechanism rendered markdown is displayed. This means that everything tagged as a
        // TODO: number should display an error if the content of the cell is not interpretable as a number.
        cell.err = new Error('#NaN')
      } else {
        // nothing has changed (had to parse to a number first to check this)
        if (parsed_value === cell.vl) return
        cell.vl = parsed_value
      }
    } else if (cell.tp === CellType.STRING) {
      cell.vl = value
    }
  }

  console.log('value changed', cell)

  // when updating a cell the data structure becomes somewhat invalid:
  // each cell has a refs array and a changes array. The only thing that
  // can happen when editing a single cell is that the refs array of this cell
  // becomes out of date and thereby also the changes arrays of the cells that
  // are no longer part of the refs array and the ones newly added need to be
  // updated accordingly.
  // The fact that this only needs a little bit of updating is good as no complex
  // code has to be written. The most complex thing is probably finding out
  // which cells need to have their changes array updated.

  const new_refs = cell.refs
  const arr = compute_additions_and_deletions(new_refs, old_refs)

  // from === 'old' -> deletion
  // from === 'new' -> addition
  arr.forEach(pair => {
    switch (pair.from) {
      case 'old':
        spreadsheet.data[pair.value[0]][pair.value[1]].changes = spreadsheet.data[pair.value[0]][pair.value[1]].changes.filter(ref =>
          ref[0] !== cell.row || ref[1] !== cell.col
        )
        console.log('in cell ' + generate_id_format(pair.value) + ' remove ' + generate_id_format(cell._id) + ' from changes')
        break
      case 'new':
        spreadsheet.data[pair.value[0]][pair.value[1]].changes.push(cell._id)
        console.log('in cell ' + generate_id_format(pair.value) + ' add ' + generate_id_format(cell._id) + ' to changes')
        break
    }
  })

  check_circular_for_cell(spreadsheet.data, cell)

  const new_cycle = cell.cycle

  if (new_cycle.length > 0 || old_cycle.length > 0) {
    // changes that need to be performed on all involved cells
    const arr = compute_additions_and_deletions(new_cycle, old_cycle).sort((a, b) => (+(b.from === 'old')) - (+(a.from === 'old')))

    // update all existing cycle arrays, even if the array is going to be removed later on
    old_cycle.forEach(([row, col]) => { spreadsheet.data[row][col].cycle = new_cycle })

    // remove cycle arrays from now unused cells and add to newly added cells
    arr.forEach(pair => {
      switch (pair.from) {
        case 'old':
          spreadsheet.data[pair.value[0]][pair.value[1]].cycle = []
          break
        case 'new':
          spreadsheet.data[pair.value[0]][pair.value[1]].cycle = new_cycle
          break
      }
    })
  }

  // a lot of stuff needs to be recalculated
  // loop through every cell mentioned in the changes array and recursively descend from there and update all of their values;
  // as elements "higher up" in the tree are being used by ones lower in the tree the higher up ones need to have been evaluated
  // before traversing further down.
  // Side Note: the changes array never changes by changing the formula EXCEPT when the formula was or is becoming a self
  // referencing formula; this might need to be handled specially
  // Side Note: it's not actually a tree as two leaves can both update the same cell, so it actually is only a directed graph
  // but some cells are visited multiple times by different leaves and could re-evaluated so they could be seen as multiple
  // nodes in a sense. With this bending of the definition it would be a tree again.
  // For programming purposes it can be thought of as a tree.
  const recurse = (cell: Cell, caller: string) => {
    const self = generate_id_format(cell._id)
    console.log(caller + ' -> ' + self, cell.vl)
    // console.assert(is_formula(cell), cell)

    try {
      cell.err = undefined // TODO: does this cause any unwanted side effects that im not aware of?
      cell._vl = cell.fn!((cell_id: string) => (get_cell(lib, spreadsheet)(cell_id, cell._id, false, spreadsheet.data[row][col]._id)), lib)
      console.log(generate_id_format(cell._id) + ' updated to ' + cell._vl)
    } catch (err) {
      cell.err = err as Error
    }

    const maybe_err = check_errors(cell)
    if (maybe_err !== undefined) cell.err = maybe_err

    cell.changes
      .filter(cell_id => !cell.cycle.find(cell_id_cycle => compare_cell_ids(cell_id, cell_id_cycle)))
      .map(([row, col]) => recurse(spreadsheet.data[row][col], self))
  }

  spreadsheet.data[row][col].changes
    .filter(cell_id => !spreadsheet.data[row][col].cycle.find(cell_id_cycle => compare_cell_ids(cell_id, cell_id_cycle)))
    .map(([row, col]) => recurse(spreadsheet.data[row][col], generate_id_format(cell._id)))
}

export {
  change_cell_types,
  update,
  handleCellChange,
}
