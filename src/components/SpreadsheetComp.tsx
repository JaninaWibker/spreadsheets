import React, { Component } from 'react'
import '../css/spreadsheet.css'

import { BorderCell, Cell as NormalCell } from './Cell'
import Selection from './Selection'
import { range, destructure, default_value, format_data, scroll_into_view_if_needed, is_formula, parse_formula, parse_cell_id_format, generate_col_id_format, generate_id_format } from '../util/helpers'
import { CellType } from '../types/CellTypes'
import type { Cell, CellId, SpreadsheetOptions } from '../types/Spreadsheet'

import lib from '../util/stdlib'

// constants for width/height of cells
const CELL_WIDTH = 224
const CELL_HEIGHT = 25

const INDEX_CELL_WIDTH = 80
const INDEX_CELL_HEIGHT = 25

// settings associated css variables in order to be able to access these constants from within css
document.documentElement.style.setProperty('--cell-width-px', CELL_WIDTH + 'px');
document.documentElement.style.setProperty('--cell-height-px', CELL_HEIGHT + 'px');

document.documentElement.style.setProperty('--index-cell-width-px', INDEX_CELL_WIDTH + 'px');
document.documentElement.style.setProperty('--index-cell-height-px', INDEX_CELL_HEIGHT + 'px');

const IDENTIFIER_CELLS: { [key: string]: CellId } = {}

const recurse = (data: Cell[][], identifier_cells: { [key: string]: CellId }, cell: Cell, origin_cell: CellId) => {
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
    recurse(data, identifier_cells, ref, origin_cell)
    if(ref.fn) {
      ref._vl = ref.fn((cell_id: string) => (get_cell(data, identifier_cells)(cell_id, ref._id, false, origin_cell)), lib)
      console.log('calculated value for cell ' + generate_id_format(ref._id) + ' (' + ref._vl + ')')
    }
  })
  if(cell.fn) {
    cell._vl = cell.fn((cell_id: string) => (get_cell(data, identifier_cells)(cell_id, cell._id, false, origin_cell)), lib)
    console.log('calculated value for cell ' + generate_id_format(cell._id) + ' (' + cell._vl + ')')
  }
  cell.visited = true
}

const parse_formulas = (_data: Cell[][], identifier_cells: { [key: string]: CellId }, cell: Cell) => {
  if(cell.name) {
    identifier_cells[cell.name] = cell._id // TODO: should this be CellId or Cell?
  }

  const {fn, refs} = (is_formula(cell) && parse_formula((cell.vl as string).substring(1))) || { fn: undefined, refs: [] }

  return { ...cell, fn, refs }
}

const descend = (data: Cell[][], identifier_cells: { [key: string]: CellId }, cell: Cell) => {
  cell.refs = cell.refs.map((ref: CellId) => typeof(ref) === 'string' ? lookup(ref, identifier_cells) : ref) as CellId[] // transform all refs into the [col, row] format
  console.warn(cell)
  if(cell.refs.find((ref: CellId) => ref[0] === cell.row && ref[1] === cell.col)) {
    cell.err = new Error("self-references not allowed")
  } else {
    console.log('-- recurse --')
    recurse(data, identifier_cells, cell, cell._id)
  }
  return cell
}

const transform = (data: Cell[][], identifier_cells: { [key: string]: CellId }) => {

  const new_data = data
    .map((row, _i, current_data) => row.map(cell => parse_formulas(current_data, identifier_cells, cell)))
    .map((row, _i, current_data) => row.map(cell => descend(current_data, identifier_cells, cell)))
    .map((row)                   => row.map(cell => ({...cell, visited: false})))


  console.log("transformed", new_data)

  return new_data
}

// this supports "ABC321", "123.123" as well as named references as cell formats
// returns null when cell not found
const lookup = (cell_id: string, identifier_cells: { [key: string]: CellId }): [number, number] | null => {
  
  // this supports both "ABC321", "123.123" as cell formats
  const pair = parse_cell_id_format(cell_id)

  // support for named references / identifiers
  if(!pair) {
    const identifierMatch = cell_id.match(/^[a-zA-Z_][a-zA-Z_0-9]*$/)
    if(identifierMatch && identifier_cells[identifierMatch[0]]) {
      return identifier_cells[identifierMatch[0]] // identifier (like variable names)
      // TODO: should this return Cell or CellId?
    } else {
      return null
    }
  } else {
    return pair
  }
}

// target is the cell for which the value should be returned
// call_cell is the cell that initiated the whole recursive descend
// byRender skips a check for circular calls as the caller (usually identified by call_cell) is not an actual cell but the renderer
// rec_call_cell is the direct caller; meaning the target of the call one stack frame lower on the call stack
const get_cell = (data: Cell[][], identifier_cells: { [key: string]: CellId }) => (target: string, call_cell: CellId, byRender=false, rec_call_cell: CellId) => {
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
          cell._vl = cell.fn((id: string) => get_cell(data, identifier_cells)(id, call_cell, false, cell._id), lib) // TODO: this might need to change when `g` changes
        } else {
          cell._vl = cell.vl || default_value(cell.tp)
        }
      }

      cell.visited = true

      return cell._vl
    }
  } else return cell.vl
}

interface IProps {
  data: Cell[][],
  name: string,
  options: SpreadsheetOptions,
  cb: any // TODO: figure out what this is actually used for
}

interface IState {
  selection: {
    start_x: number,
    start_y: number,
    end_x: number,
    end_y: number,
    // _start_x: number,
    // _start_y: number,
    // _end_x: number,
    // _end_y: number
  },
  focused: {
    x: number,
    y: number
  },
  dimensions: {
    x: number,
    y: number
  }
}

export default class Spreadsheet extends Component<IProps, IState> {

  data: Cell[][]
  name: string
  columns: number
  rows: number
  g: any // TODO: specify further

  constructor(props: IProps) {
    super(props)

    // TODO: transform this.props.data here (could some of this already happen while initially generating the cells (fillTable, ...)?; adding extra values, parsing formulas, building inverse dependency tree)
    this.data    = transform(this.props.data, IDENTIFIER_CELLS)
    this.name    = this.props.name
    this.columns = this.data[0].length
    this.rows    = this.data.length

    this.props.cb(this.data, this.update)
    this.g = get_cell(this.data, IDENTIFIER_CELLS)

    this.state = {
      selection: {
        start_x: 0,
        start_y: 0,
        end_x: 0,
        end_y: 0,
        // _start_x: 0,
        // _start_y: 0,
        // _end_x: 0,
        // _end_y: 0
      },
      focused: {
        x: 0,
        y: 0
      },
      dimensions: {
        x: this.data[0].length,
        y: this.data.length
      }
    }
  }

  componentDidUpdate(_prevProps: Readonly<IProps> & Readonly<{ children?: any }>) { // TODO: use ReactNode instead of any
    if(this.name !== this.props.name) {
      this.name    = this.props.name
      this.data    = transform(this.props.data, IDENTIFIER_CELLS)
      this.columns = this.data[0].length
      this.rows    = this.data.length

      this.g = get_cell(this.data, IDENTIFIER_CELLS)

      this.props.cb(this.data, this.update)

      this.forceUpdate()
    }
  }

  _update = (cell_id: CellId) => {
    const [col, row] = cell_id
    const cell = this.data[col][row]

    this.data[col][row].visited = false

    if(cell.changes) cell.changes.map(this._update)
  }

  update = (cell_id: CellId) => {
    this._update(cell_id)
    this.forceUpdate()
  }

  handleMouseSelection = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, id: string) => {
    const [row, col] = id.split('.')
    if(e.type === 'mousedown')
      this.setState({selection: {
        start_x: parseInt(col, 10),
        start_y: parseInt(row, 10),
        end_x: parseInt(col, 10),
        end_y: parseInt(row, 10)
      }})
    else if(e.type === 'mouseup')
      this.setState({selection: {
        start_x: this.state.selection.start_x,
        start_y: this.state.selection.start_y,
        end_x: parseInt(col, 10),
        end_y: parseInt(row, 10)
      }})
    else if(e.type === 'mouseenter' && e.buttons === 1)
      this.setState({selection: {
        start_x: this.state.selection.start_x,
        start_y: this.state.selection.start_y,
        end_x: parseInt(col, 10),
        end_y: parseInt(row, 10)
      }})
  }

  handleKeypress = (key: "ArrowLeft" | "ArrowUp" | "ArrowRight" | "ArrowDown", shift: boolean, alt: boolean, ctrl: boolean, preventDefault: () => any) => {
    const sx: number = { ArrowLeft: -1, ArrowRight: 1, ArrowUp:  0, ArrowDown: 0 }[key] || 0
    const sy: number = { ArrowLeft:  0, ArrowRight: 0, ArrowUp: -1, ArrowDown: 1 }[key] || 0

    // TODO: ctrl snaps to edge (should also work together with alt)

    // TODO: tab should select the next cell (shift tab inverse; ctrl either no difference or input completely ignored)

    // TODO: if currently at pos1 and using shift to select an area that spans
    // TODO: from pos1 to pos2 and then pressing an arrow key without shift or
    // TODO: alt it should act as if the current position is pos2, not pos1
    // TODO: which is how it currently works

    // TODO: set proper focus to the cell underneath the cursor; this allows pressing enter or similar to start editing

    preventDefault()

    this.setState({selection: {
      start_x: Math.min(this.state.dimensions.x-1, Math.max(0, this.state.selection.start_x + ((shift && !alt) ? 0 : sx))),
      start_y: Math.min(this.state.dimensions.y-1, Math.max(0, this.state.selection.start_y + ((shift && !alt) ? 0 : sy))),
      end_x: Math.min(this.state.dimensions.x-1, Math.max(0, ((alt || shift) ? this.state.selection.end_x : this.state.selection.start_x) + sx)),
      end_y: Math.min(this.state.dimensions.y-1, Math.max(0, ((alt || shift) ? this.state.selection.end_y : this.state.selection.start_y) + sy)),
    }, focused: {
      x: this.state.selection.start_x,
      y: this.state.selection.start_y
    }}, () => {
      // if(this.selectionElement) scroll_into_view_if_needed(this.selectionElement) // TODO: what is the purpose of this exactly?; well this element SHOULD exist but somehow isn't mentioned anywhere else
    })
  }

  handleCellChange = (cell: Cell, value: string) => {
    const [row, col] = cell._id

    if(cell.name) {
      IDENTIFIER_CELLS[cell.name] = cell._id
    }

    // nothing has changed (this check only works if vl is a string; numbers are explicitly checked again later on)
    if(value === cell.vl) return

    // used to compute which cells need to have their changes array updated
    const old_refs = this.data[row][col].refs

    // if formula then assign new value to .vl and compute .fn
    if(value.startsWith('=')) {
      const {fn, refs} = parse_formula(value.substring(1))!
      this.data[row][col].vl = value
      this.data[row][col].fn = fn
      this.data[row][col].refs = refs
    } else {
      if(this.data[row][col].tp === CellType.NUMBER) {
        const parsed_value = parseFloat(value)
        if(isNaN(parsed_value)) {
          console.log(this.data[row][col])
          // TODO: what should happen here? this is what gets run if the value that is inputted is not a
          // TODO: number, but should the error be generated here or somewhere else; considering that no
          // TODO: other input is ever somehow flagged as invalid (you can perfectly well place strings
          // TODO: in a NUMBER cell using a reference) should this even be an error? I feel like there
          // TODO: should be stronger safe-guards against this and errors should be displayed using the
          // TODO: same mechanism rendered markdown is displayed. This means that everything tagged as a
          // TODO: number should display an error if the content of the cell is not interpretable as a number.
          this.data[row][col].err = new Error("#NaN")
        } else {
          // nothing has changed (had to parse to a number first to check this)
          if(parsed_value === cell.vl) return
          this.data[row][col].vl = parsed_value
        }
      } else if(this.data[row][col].tp === CellType.STRING) {
        this.data[row][col].vl = value
      }
    }

    console.log('value changed', this.data[row][col])

    // when updating a cell the data structure becomes somewhat invalid:
    // each cell has a refs array and a changes array. The only thing that
    // can happen when editing a single cell is that the refs array of this cell
    // becomes out of date and thereby also the changes arrays of the cells that
    // are no longer part of the refs array and the ones newly added need to be
    // updated accordingly.
    // The fact that this only needs a little bit of updating is good as no complex
    // code has to be written. The most complex thing is probably finding out
    // which cells need to have their changes array updated.

    this.data[row][col].refs = this.data[row][col].refs.map(ref => typeof(ref) === 'string' ? lookup(ref, IDENTIFIER_CELLS) : ref) as CellId[]
    if(this.data[row][col].refs.find(ref => ref[0] === this.data[row][col].row && ref[1] === this.data[row][col].col)) {
      this.data[row][col].err = new Error("self-references not allowed")
    } else {
      const new_refs = this.data[row][col].refs
      const arr = old_refs.map(ref => ({ from: 'old', value: ref }))

      // this basically calculates (A u B) \ (A n B) while also saving from which array each element is from
      new_refs.forEach(ref => {
        const idx = arr.findIndex(item => item.value[0] === ref[0] && item.value[1] === ref[1])
        if(idx !== -1) {
          arr.splice(idx, 1)
        } else {
          arr.push({ from: 'new', value: ref })
        }
      })

      // from === 'old' -> deletion
      // from === 'new' -> addition
      arr.forEach(pair => {
        switch(pair.from) {
          case 'old': {
            this.data[pair.value[0]][pair.value[1]].changes = this.data[pair.value[0]][pair.value[1]].changes.filter(ref =>
              ref[0] !== cell.row || ref[1] !== cell.col
            )
            console.log('in cell ' + generate_id_format(pair.value) + ' remove ' + generate_id_format(cell._id) + ' from changes')
          } break;
          case 'new': {
            this.data[pair.value[0]][pair.value[1]].changes.push(cell._id)
            console.log('in cell ' + generate_id_format(pair.value) + ' add ' + generate_id_format(cell._id) + ' to changes')
          } break;
        }
      })
    }

    // a lot of stuff needs to be recalculated
    // loop through every cell mentioned in the changes array and recursively descend from there and update all of their values;
    // as elements "higher up" in the tree are being used by ones lower in the tree the higher up ones need to have been evaluated
    // before traversing further down.
    // Side Note: it's not actually a tree as two leaves can both update the same cell, so it actually is only a directed graph
    // but some cells are visited multiple times by different leaves and could re-evaluated so they could be seen as multiple
    // nodes in a sense. With this bending of the definition it would be a tree again.
    // For programming purposes it can be thought of as a tree.
    const recurse = (cell: Cell, caller: string) => {
      const self = generate_id_format(cell._id)
      console.log(caller + ' -> ' + self, cell.vl)
      // console.assert(is_formula(cell), cell)

      try {
        cell._vl = cell.fn!((cell_id: CellId) => (this.g(cell_id, cell._id, false, this.data[row][col]._id)), lib)
        console.log(generate_id_format(cell._id) + ' updated to ' + cell._vl)
        // TODO: handle format errors here as well?
      } catch(err) {
        cell.err = err
      }

      cell.changes.map(([row, col]) => recurse(this.data[row][col], self))

    }
    this.data[row][col].changes.map(([row, col]) => recurse(this.data[row][col], generate_id_format(cell._id)))

    this.update(cell._id)
  }

  render_cell(cell: Cell) { // TODO: this function is called ALL THE TIME for EVERY CELL, realistically it only needs to be called on first render and maybe when a cells needs explicit updating

    const v = this.g(cell.id, cell._id, true, cell._id) // TODO: this might need to change when `g` changes

    // console.log('called for cell: ' + generate_id_format(cell._id) + ' new value: ' + v)

    return (
      <NormalCell
        key={cell.row + '.' + cell.col}
        id={cell.row + '.' + cell.col}
        content={format_data(v, cell.tp, cell.stp, cell.r_dec || this.props.options.rounding)}
        editable={cell.tp === CellType.NUMBER || cell.tp === CellType.STRING}
        style={cell.style ? cell.style : {}}
        onValueChange={this.handleCellChange.bind(this, cell)}
        onMouseEvent={this.handleMouseSelection}
        onArrowKeyEvent={this.handleKeypress}
        raw_data={cell.fn ? cell.vl : v}
        tp={cell.tp}
        isFocused={false} />
    )
  }

  // `+1` because of some weird situation where a scrollbar would appear because of some subpixel stuff or something
  // I guess almost everyone has seen this kind of weirdness before where it should be enough but like 0.01px more are
  // required for some reason (could be floating point precision but I don't think so, probably just subpixel rendering stuff)
  render() {
    return (
      <div style={{
        width: (((this.data[0].length) * CELL_WIDTH) + INDEX_CELL_WIDTH + 1) + 'px',
        height: (((this.data.length) * CELL_HEIGHT) + INDEX_CELL_HEIGHT + 1) + 'px'
      }}>
        <table className="table">
          <tbody>
            <tr id={'r0l'} key={'r0l'}>
              <th className="border border-left-top" id={'c0r0_'} key={'c0r0_'}>{'/'}</th>
              {range(this.columns).map(col_num =>
                  <BorderCell key={'c' + col_num + '_'} id={'c' + col_num + '_'} className="border-top" content={generate_col_id_format(col_num)} />
              )}
            </tr>
            {range(this.rows).map(row_num =>
              <tr id={'r' + row_num} key={'r' + row_num}>
                <BorderCell key={'r' + row_num + '_'} id={'r' + row_num + '_'} className="border-left" content={String(row_num+1)} />
                {range(this.columns).map(col_num => this.render_cell(this.data[row_num][col_num]))}
              </tr>
            )}
          </tbody>
        </table>
        <Selection
          start={{ x: this.state.selection.start_x, y: this.state.selection.start_y }}
          end=  {{ x: this.state.selection.end_x,   y: this.state.selection.end_y }}
          constants={{
            cell_width:       CELL_WIDTH,       cell_height:       CELL_HEIGHT,
            index_cell_width: INDEX_CELL_WIDTH, index_cell_height: INDEX_CELL_HEIGHT}}
        />
      </div>
    )
  }
}
