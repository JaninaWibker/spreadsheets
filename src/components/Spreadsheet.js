import React, { Component } from 'react'
import '../css/spreadsheet.css'

import { BorderCell, Cell } from './Cell.js'
import Selection from './Selection.js'
import { range, destructure, default_value, format_data, scroll_into_view_if_needed, is_formula, parse_formula, parse_cell_id_format, generate_col_id_format, CELL_TYPE } from '../util/helpers.js'

import lib from '../util/stdlib.js'

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

const IDENTIFIER_CELLS = {}


const transform = (data, identifier_cells) => {


  const new_data = data.map(row =>
    row.map(cell => {
      if(cell.name) {
        identifier_cells[cell.name] = cell._id
      }

      const {fn, refs} = (is_formula(cell) && parse_formula(cell.vl.substring(1))) || { fn: undefined, refs: [] }

      return { ...cell, fn, refs }
    }).map(cell => {
      cell.refs = cell.refs.map(ref => typeof(ref) === 'string' ? lookup(ref, identifier_cells) : ref)
      
      if(cell.refs.find(ref => ref[0] === cell.row && ref[1] === cell.col)) {
        cell.err = new Error("self-references not allowed")
      }
      return cell
    })
  )


  return new_data
}

// this supports "ABC321", "123.123" as well as named references as cell formats
// returns null when cell not found
const lookup = (cell_id, identifier_cells) => {
  
  // this supports both "ABC321", "123.123" as cell formats
  const pair = parse_cell_id_format(cell_id)

  // support for named references / identifiers
  if(!pair) {
    const identifierMatch = cell_id.match(/^[a-zA-Z_][a-zA-Z_0-9]*$/)
    if(identifierMatch && identifier_cells[identifierMatch[0]]) {
      return identifier_cells[identifierMatch[0]] // identifier (like variable names)
    } else {
      return null
    }
  } else {
    return pair
  }
}

// TODO: improve the way cells are labelled / identified

// g stands for get and was used directly before a proper excel syntax parser was implemented, that is why the name is so short
const get_cell = (data, identifier_cells) => (cell, call_cell, byRender=false, rec_call_cell) => {
  // console.log(cell, call_cell, byRender, rec_call_cell)

  const pair = lookup(cell, identifier_cells)

  if(!pair) {
    throw Error('not a valid Cell (named cell not defined or mistakenly identified as identifier (if this is what happened, you probably have an error in your selector))')
  }

  const [c_row, c_col] = pair
  const c = data[c_row][c_col]

  // const cs = call_cell
  // const cc = data[cs[0]][cs[1]]

  const [rc_row, rc_col] = rec_call_cell
  const rcc = data[rc_row][rc_col]

  if(c === undefined) {
    console.log(cell, call_cell, c)
    return '<error>'
  }

  if(c.tp === CELL_TYPE.EMPTY) return ''
  if(c.tp === CELL_TYPE.NUMBER || c.tp === CELL_TYPE.STRING) {

    // add 'changes'-array to the current cell including the caller of g (the previous function in the callstack, (and the cell of this function))
    // if the array does exist already, the id of the cell is just pushed to it
    if(c_row !== rc_row || c_col !== rc_col) {
      console.log('caller', rcc, 'current', c)

      if(Array.isArray(c.changes) && !c.changes.includes(rcc.id)) { // TODO: this technically needs to be more sophisticated now as ids aren't just strings anymore but this code will be removed soon so it shouldn't really matter
        // c.changes.push(rcc.id)
      } else if(!Array.isArray(c.changes)) {
        // c.changes = [rcc.id]
      }


      console.log(destructure(rcc, ['id', 'changes', 'visited']), destructure(c, ['id', 'changes', 'visited']))
    }

    if(!c.fn) return c.vl
    if(c.fn) {
      // if already calculated then add visited = true, else check if it is a circular call and if it is
      // return the default value for this data type, else calculate the value by executing the function
      if(c.visited === undefined || c.visited === false) {
        if(c_row !== call_cell[0] || c_col !== call_cell[1] || byRender) {
          console.log(c.id, rcc.id)
          c._vl = c.fn(id => get_cell(data, identifier_cells)(id, call_cell, false, c._id), lib) // TODO: this might need to change when `g` changes
        } else {
          c._vl = c.vl || default_value(c.tp)
        }
      }

      c.visited = true

      return c._vl
    }
  } else return c.vl
}

export default class Spreadsheet extends Component {
  constructor(props) {
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
        _start_x: 0,
        _start_y: 0,
        _end_x: 0,
        _end_y: 0
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

  componentDidUpdate(prevProps) {
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

  _update = (cell_id) => {
    const [col, row] = cell_id
    const cell = this.data[col][row]

    this.data[col][row].visited = false

    if(cell.changes) cell.changes.map(this._update)
  }

  update = (cell_id) => {
    this._update(cell_id)
    this.forceUpdate()
  }

  handleMouseSelection = (e, id) => {
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

  handleKeypress = (key, shift, alt, ctrl, preventDefault) => {
    const sx = { ArrowLeft: -1, ArrowRight: 1 }[key] || 0
    const sy = { ArrowUp:   -1, ArrowDown:  1 }[key] || 0

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
    }}, _ => {
      if(this.selectionElement) scroll_into_view_if_needed(this.selectionElement)
    })
  }

  handleCellChange = (cell, value) => {
    const [col, row] = cell._id
    if(cell.name) {
      IDENTIFIER_CELLS[cell.name] = cell._id // TODO: this is not necessary on first render; it might however be necessary after modifying a cell (once actually naming cells is implemented; don't know how that would be done though)
    }
    // if formula then assign new value to .vl and compute .fn
    if(value.startsWith('=')) {
      this.data[row][col].vl = value
      this.data[row][col].fn = parse_formula(value.substring(1)).fn // TODO: don't throw away refs
    } else {
      if(this.data[row][col].tp === CELL_TYPE.NUMBER) {
        if(isNaN(parseFloat(value))) {
          console.log(this.data[row][col])
          // TODO: what should happen here? this is what gets run if the value that is inputted is not a
          // TODO: number, but should the error be generated here or somewhere else; considering that no
          // TODO: other input is ever somehow flagged as invalid (you can perfectly well place strings
          // TODO: in a NUMBER cell using a reference) should this even be an error? I feel like there
          // TODO: should be stronger safe-guards against this and errors should be displayed using the
          // TODO: same mechanism rendered markdown is displayed. This means that everything tagged as a
          // TODO: number should display an error if the content of the cell is not interpretable as a number.
          this.data[row][col].error = new Error("#NaN")
        } else {
          this.data[row][col].vl = parseFloat(value)
        }
      } else if(this.data[row][col].tp === CELL_TYPE.STRING) {
        this.data[row][col].vl = value
      }
    }

    this.update(cell._id)
  }

  render_cell(cell) { // TODO: this function is called ALL THE TIME for EVERY CELL, realistically it only needs to be called on first render and maybe when a cells needs explicit updating
    console.log('called for cell: ' + generate_col_id_format(cell.col) + (cell.row+1))

    const v = this.g(cell.id, cell._id, true, cell._id) // TODO: this might need to change when `g` changes

    return (
      <Cell
      key={cell.row + '.' + cell.col}
      id={cell.row + '.' + cell.col}
      content={format_data(v, cell.tp, cell.stp, cell.r_dec || this.props.options.rounding)}
      editable={cell.tp === CELL_TYPE.NUMBER || cell.tp === CELL_TYPE.STRING}
      style={cell.style ? cell.style : null}
      onValueChange={this.handleCellChange.bind(this, cell)}
      onMouseEvent={this.handleMouseSelection}
      onArrowKeyEvent={this.handleKeypress}
      raw_data={cell.fn ? cell.vl : v}
      tp={cell.tp} />
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
                <BorderCell key={'r' + row_num + '_'} id={'r' + row_num + '_'} className="border-left" content={row_num+1} />
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
