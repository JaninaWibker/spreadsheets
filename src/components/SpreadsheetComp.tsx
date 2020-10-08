import React, { Component } from 'react'
import '../css/spreadsheet.css'

import { BorderCell, Cell as NormalCell } from './Cell'
import Selection from './Selection'
import { range, format_data, scroll_into_view_if_needed, parse_formula, lookup } from '../util/helpers'
import { generate_col_id_format, generate_id_format } from '../util/cell_id'
import { get_cell, transform, check_errors } from '../util/cell_transform'
import type { getCellCurried } from '../util/cell_transform'
import { CellType } from '../types/CellTypes'
import type { Cell, CellId, SpreadsheetOptions } from '../types/Spreadsheet'
import platform_detection from '../util/platform-detection'

import lib from '../util/stdlib'

// constants for width/height of cells
const CELL_WIDTH = 224 // TODO: apparently this should be configurable via this.props.options (don't know if this is really needed though)
const CELL_HEIGHT = 25

const BORDER_CELL_WIDTH = 80
const BORDER_CELL_HEIGHT = 25

// settings associated css variables in order to be able to access these constants from within css
document.documentElement.style.setProperty('--cell-width-px', CELL_WIDTH + 'px');
document.documentElement.style.setProperty('--cell-height-px', CELL_HEIGHT + 'px');

document.documentElement.style.setProperty('--border-cell-width-px', BORDER_CELL_WIDTH + 'px');
document.documentElement.style.setProperty('--border-cell-height-px', BORDER_CELL_HEIGHT + 'px');

const IDENTIFIER_CELLS: { [key: string]: CellId } = {}

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
  g: getCellCurried

  constructor(props: IProps) {
    super(props)

    this.data    = transform(lib, this.props.data, IDENTIFIER_CELLS)
    this.name    = this.props.name
    this.columns = this.data[0].length
    this.rows    = this.data.length

    this.props.cb(this.data, this.update)
    this.g = get_cell(lib, this.data, IDENTIFIER_CELLS)

    this.state = {
      selection: {
        start_x: 0,
        start_y: 0,
        end_x: 0,
        end_y: 0,
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

  componentDidUpdate(_prevProps: Readonly<IProps> & Readonly<{ children?: React.ReactNode }>) {
    if(this.name !== this.props.name) {
      this.name    = this.props.name
      this.data    = transform(lib, this.props.data, IDENTIFIER_CELLS)
      this.columns = this.data[0].length
      this.rows    = this.data.length

      this.g = get_cell(lib, this.data, IDENTIFIER_CELLS)

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
    const [row_str, col_str] = id.split('.')
    const row = parseInt(row_str, 10)
    const col = parseInt(col_str, 10)
    const whole_row = col_str === '_' // if column is unspecified it means whole row
    const whole_col = row_str === '_' // if row is unspecified it means whole column

    const modifiers = (({ shiftKey, altKey, metaKey, ctrlKey }) => ({
      shift: shiftKey, alt: altKey, meta: metaKey, ctrl: ctrlKey
    }))(e)

    if(e.type === 'mousedown') { // start dragging OR shift-clicking
      if(modifiers.shift) {
        this.setState({ selection: {
          start_x:  this.state.selection.start_x,
          start_y:  this.state.selection.start_y,
          end_x:    col,
          end_y:    row,
        }})
      } else {
        this.setState({ selection: {
          start_x:  col,
          start_y:  row,
          end_x:    col,
          end_y:    row,
        }})
      }
    } else if(e.type === 'mouseup') { // stop dragging
      this.setState({ selection: {
        start_x:  this.state.selection.start_x,
        start_y:  this.state.selection.start_y,
        end_x:    col,
        end_y:    row,
      }})
    } else if(e.type === 'mouseenter' && e.buttons === 1) { // dragging (without explicitely starting or stopping)
      this.setState({ selection: {
        start_x:  this.state.selection.start_x,
        start_y:  this.state.selection.start_y,
        end_x:    col,
        end_y:    row,
      }})
    } else if(e.type === 'click') { // clicking on border cell
      if(modifiers.shift) { // enlarge selection (using start of selection)
        this.setState({ selection: {
          start_x: whole_row ? 0 : this.state.selection.start_x,
          start_y: whole_col ? 0 : this.state.selection.start_y,
          end_x:   whole_row ? this.state.dimensions.x-1 : col,
          end_y:   whole_col ? this.state.dimensions.y-1 : row,
        }})
      } else {
        console.log(`from ${whole_row ? 0 : col}.${whole_col ? 0 : row} to ${whole_row ? this.state.dimensions.x-1 : col}.${whole_col ? this.state.dimensions.y-1 : row}`)
        this.setState({ selection: {
          start_x:  whole_row ? 0 : col,
          start_y:  whole_col ? 0 : row,
          end_x:    whole_row ? this.state.dimensions.x-1 : col,
          end_y:    whole_col ? this.state.dimensions.y-1 : row,
        }})
      }
    }
  }

  handleKeypress = (key: "ArrowLeft" | "ArrowUp" | "ArrowRight" | "ArrowDown", shift: boolean, alt: boolean, ctrl: boolean, meta: boolean, preventDefault: () => any) => {
    const sx: number = { ArrowLeft: -1, ArrowRight: 1, ArrowUp:  0, ArrowDown: 0 }[key] || 0
    const sy: number = { ArrowLeft:  0, ArrowRight: 0, ArrowUp: -1, ArrowDown: 1 }[key] || 0

    // TODO: set proper focus to the cell underneath the cursor; this allows pressing enter or similar to start editing

    // TODO: tab should select the next cell (shift tab inverse; ctrl either no difference or input completely ignored)

    // TODO: probably not the right place to add this but escape should deselect any selected cells and delete / bspace 
    // TODO: should delete contents of all selected cells (at ones; trigger update after all deletions are completed)

    const mod = platform_detection.isMacOrIos() ? meta : ctrl // choose appropriate modifier for platform

    const asx = sx * (mod ? this.state.dimensions.x : 1) // adjusted change in x direction
    const asy = sy * (mod ? this.state.dimensions.y : 1) // adjusted change in y direction

    preventDefault()

    this.setState({selection: {
      start_x: Math.min(this.state.dimensions.x-1, Math.max(0, this.state.selection.start_x + ((shift && !alt) ? 0 : asx))),
      start_y: Math.min(this.state.dimensions.y-1, Math.max(0, this.state.selection.start_y + ((shift && !alt) ? 0 : asy))),
      end_x: Math.min(this.state.dimensions.x-1, Math.max(0, ((alt || shift) ? this.state.selection.end_x : this.state.selection.start_x) + asx)),
      end_y: Math.min(this.state.dimensions.y-1, Math.max(0, ((alt || shift) ? this.state.selection.end_y : this.state.selection.start_y) + asy)),
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

    this.data[row][col].err = undefined // resetting error; if it still exists it's going to get recomputed

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

    // TODO: how is re-checking for circular datastructures done? apparently it just isn't

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
        cell._vl = cell.fn!((cell_id: string) => (this.g(cell_id, cell._id, false, this.data[row][col]._id)), lib)
        console.log(generate_id_format(cell._id) + ' updated to ' + cell._vl)
      } catch(err) {
        cell.err = err
      }

      const maybe_err = check_errors(cell)
      if(maybe_err !== undefined) cell.err = maybe_err

      cell.changes.map(([row, col]) => recurse(this.data[row][col], self))

    }
    this.data[row][col].changes.map(([row, col]) => recurse(this.data[row][col], generate_id_format(cell._id)))

    this.update(cell._id)
  }

  render_cell(cell: Cell) {

    const v = this.g(cell.id, cell._id, true, cell._id) // TODO: this might need to change when `g` changes

    // console.log('called for cell: ' + generate_id_format(cell._id) + ' new value: ' + v)

    return (
      <NormalCell
        key={cell.row + '.' + cell.col}
        id={cell.row + '.' + cell.col}
        content={cell.err ? cell.err.message : format_data(v, cell.tp, cell.stp, cell.r_dec || this.props.options.rounding)}
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
        width: (((this.data[0].length) * CELL_WIDTH) + BORDER_CELL_WIDTH + 1) + 'px',
        height: (((this.data.length) * CELL_HEIGHT) + BORDER_CELL_HEIGHT + 1) + 'px'
      }}>
        <table className="table">
          <tbody>
            <tr id={'r0l'} key={'r0l'}>
              <BorderCell key={'_._'} id={'_._'} className="" onMouseEvent={this.handleMouseSelection} content="/" />
              {/* <th className="border border-left-top" id={'_._'} key={'_._'} onClick={e => this.handleMouseSelection(e, '_._')}><div><span>{'/'}</span></div></th> */}
              {range(this.columns).map(col_num =>
                  <BorderCell key={'_.' + col_num} id={'_.' + col_num} className="border-top" content={generate_col_id_format(col_num)} onMouseEvent={this.handleMouseSelection} />
              )}
            </tr>
            {range(this.rows).map(row_num =>
              <tr id={'r' + row_num} key={'r' + row_num}>
                <BorderCell key={row_num + '._'} id={row_num + '._'} className="border-left" content={String(row_num+1)} onMouseEvent={this.handleMouseSelection} />
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
            index_cell_width: BORDER_CELL_WIDTH, index_cell_height: BORDER_CELL_HEIGHT}}
        />
      </div>
    )
  }
}
