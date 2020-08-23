import React, { Component } from 'react'
import '../css/spreadsheet.css'

import { BorderCell, Cell } from './Cell.js'
import Selection from './Selection.js'
import { range, destructure, default_value, format_data, scrollIntoViewIfNeeded, Alphabet, parse_formula } from '../util/helpers.js'

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

export default class Spreadsheet extends Component {
  constructor(props) {
    super(props)

    this.data    = this.props.data
    this.name    = this.props.name
    this.columns = this.data[0].length
    this.rows    = this.data.length

    this.update  = this.update.bind(this)
    this._update = this._update.bind(this)

    this.props.cb(this.data, this.update)

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

    // g stands for get and was used directly before a proper excel syntax parser was implemented, that is why the name is so short
    const g = (cell, call_cell, byRender=false, rec_call_cell) => {
      //console.log(cell, call_cell, byRender, rec_call_cell)
      let s
      // support both g('A1') and g('1.1')
      if(cell.indexOf('.') === -1) {
        const match = cell.match(/^([a-zA-Z])+([0-9]+)$/)
        if(match) {
          // possible bug: would this fail for 'ABC213'?
          s = [parseInt(match[2], 10)-1, Alphabet.indexOf(match[1].toUpperCase())] // excel-like format (A1, B5, ...)
        } else {
          const identifierMatch = cell.match(/^[a-zA-Z_][a-zA-Z_0-9]*$/)
          if(identifierMatch && IDENTIFIER_CELLS[identifierMatch[0]]) {
            s = IDENTIFIER_CELLS[identifierMatch[0]] // identifier (like variable names)
          } else {
            throw Error('not a valid Cell (named cell not defined or mistakenly identified as identifier (if this is what happened, you probably have an error in your selector))')
          }
        }
      } else {
        s = cell.split('.') // dot-seperated (was the default, excel-like and identifier were added later on, so this is kind of like the prefered way)
      }
      const c = this.data[s[0]][s[1]]

      const cs = call_cell.split('.')
      const cc = this.data[cs[0]][cs[1]]

      const rcs = rec_call_cell.split('.')
      const rcc = this.data[rcs[0]][rcs[1]]

      if(c === undefined) {
        console.log(cell, call_cell, c)
        return '<error>'
      }

      if(c.tp === 'EMPTY') return ''
      // if(c.tp === 'STRING') return c.vl // also allow functions that return strings
      if(c.tp === 'NUMBER' || c.tp === 'STRING') {

        // add 'changes'-array to the current cell including the caller of g (the previous function in the callstack, (and the cell of this function))
        // if the array does exist already, the id of the cell is just pushed to it
        if(cell !== rec_call_cell) {
          console.log('caller', this.data[rcs[0]][rcs[1]], 'current', this.data[s[0]][s[1]])

          if(Array.isArray(this.data[s[0]][s[1]].changes) && !this.data[s[0]][s[1]].changes.includes(rcc.id))
            this.data[s[0]][s[1]].changes.push(rcc.id)
          else if(!Array.isArray(this.data[s[0]][s[1]].changes))
            this.data[s[0]][s[1]].changes = [rcc.id]


          console.log(destructure(this.data[rcs[0]][rcs[1]], ['id', 'changes', 'visited']), destructure(this.data[s[0]][s[1]], ['id', 'changes', 'visited']))
        }

        if(!c.fn) return c.vl
        if(c.fn) {
          // if already calculated then add visited = true, else check if it is a circular call and if it is
          // return the default value for this data type, else calculate the value by executing the function
          if(this.data[s[0]][s[1]].visited === undefined || this.data[s[0]][s[1]].visited === false) {
            if(cell !== call_cell || byRender) {
              console.log(c.id, rcc.id)
              this.data[s[0]][s[1]]._vl = c.fn(id => g(id, call_cell, false, c.id), lib)
            } else {
              this.data[s[0]][s[1]]._vl = this.data[s[0]][s[1]].vl || default_value(this.data[s[0]][s[1]].tp)
            }
          }

          this.data[s[0]][s[1]].visited = true

          return this.data[s[0]][s[1]]._vl
        }
      } else return c.vl
    }

    this.g = g.bind(this)
  }

  componentDidUpdate(prevProps) {
    if(this.name !== this.props.name) {
      this.name    = this.props.name
      this.data    = this.props.data
      this.columns = this.data[0].length
      this.rows    = this.data.length

      this.props.cb(this.data, this.update)

      this.forceUpdate()
    }
  }

  _update(cell) {
    const s = cell.split('.')
    const c = this.data[s[0]][s[1]]

    this.data[s[0]][s[1]].visited = false

    if(c.changes) c.changes.map(this.update)
  }

  update(cell) {
    this._update(cell)
    this.forceUpdate()
  }

  render_cell(cell) {
    const s = cell.id.split('.')
    if(cell.name) {
      IDENTIFIER_CELLS[cell.name] = [s[0], s[1]]
    }
    const editable = (cell.tp === 'NUMBER' || cell.tp === 'STRING')

    if(cell.vl && (typeof(cell.vl) === 'string') && cell.vl.startsWith('=') && !cell.fn) cell.fn = parse_formula(cell.vl.substring(1))
    

    const cb = (value) => {
      // if formula then assign new value to .vl and compute .fn
      if(value.startsWith('=')) {
        this.data[s[0]][s[1]].vl = value
        this.data[s[0]][s[1]].fn = parse_formula(value.substring(1))
      } else {
        if(this.data[s[0]][s[1]].tp === 'NUMBER') {
          if(isNaN(parseFloat(value))) {
            // this.data[s[0]][s[1]].vl // TODO: what is this even used for?
          } else {
            this.data[s[0]][s[1]].vl = parseFloat(value)
          }
        } else if(this.data[s[0]][s[1]].tp === 'STRING') {
          this.data[s[0]][s[1]].vl = value
        }
      }

      this.update(cell.id)
    }

    const v = this.g(cell.id, cell.id, true, cell.id)

    return (
      <Cell
      key={s[0] + '.' + s[1]}
      id={s[0] + '.' + s[1]}
      content={format_data(v, cell.tp, cell.stp, cell.r_dec || this.props.options.rounding)}
      editable={editable}
      style={cell.style ? cell.style : null}
      cb={cb}
      sel_cb={(e, id) => {
        const s = id.split('.')
        if(e.type === 'mousedown')
          this.setState({selection: {
            start_x: parseInt(s[1], 10),
            start_y: parseInt(s[0], 10),
            end_x: parseInt(s[1], 10),
            end_y: parseInt(s[0], 10)
          }})
        else if(e.type === 'mouseup')
          this.setState({selection: {
            start_x: this.state.selection.start_x,
            start_y: this.state.selection.start_y,
            end_x: parseInt(s[1], 10),
            end_y: parseInt(s[0], 10)
          }})
        else if(e.type === 'mouseenter' && e.buttons === 1)
          this.setState({selection: {
            start_x: this.state.selection.start_x,
            start_y: this.state.selection.start_y,
            end_x: parseInt(s[1], 10),
            end_y: parseInt(s[0], 10)
          }})
      }}
      handleArrowKeys={(key, shift, alt, ctrl, preventDefault) => {
        const sx = { ArrowLeft: -1, ArrowRight: 1 }[key] || 0
        const sy = { ArrowUp:   -1, ArrowDown:  1 }[key] || 0

        preventDefault()

        this.setState({selection: {
          start_x: Math.min(this.state.dimensions.x-1, Math.max(0, this.state.selection.start_x + ((shift && !alt) ? 0 : sx))),
          start_y: Math.min(this.state.dimensions.y-1, Math.max(0, this.state.selection.start_y + ((shift && !alt) ? 0 : sy))),
          end_x: Math.min(this.state.dimensions.x-1, Math.max(0, ((alt || shift) ? this.state.selection.end_x : this.state.selection.start_x) + sx)),
          end_y: Math.min(this.state.dimensions.y-1, Math.max(0, ((alt || shift) ? this.state.selection.end_y : this.state.selection.start_y) + sy)),
        }, focused: {
          x: this.state.selection.start_x,
          y: this.state.selection.start_y
        }}, x => {
          if(this.selectionElement) scrollIntoViewIfNeeded(this.selectionElement)
        })
      }}
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
                  <BorderCell key={'c' + col_num + '_'} id={'c' + col_num + '_'} className="border-top" content={Alphabet[col_num]} />
              )}
            </tr>
            {range(this.rows).map(row_num =>
              <tr id={'r' + row_num} key={'r' + row_num}>
                <BorderCell key={'r' + row_num + '_'} id={'r' + row_num + '_'} className="border-left" content={row_num+1} />
                {range(this.columns).map(y => this.render_cell(this.data[row_num][y]))}
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
