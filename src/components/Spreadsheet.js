import React, { Component } from 'react'
import styled from 'styled-components'
import '../css/spreadsheet.css'

import Cell from './Cell.js'
import { range, round, destructure, default_value, marked, format_data, isInViewport, scrollIntoViewIfNeeded, Alphabet, alphabet } from '../util/helpers.js'

const CELL_WIDTH = 224
const CELL_WIDTH_PX = CELL_WIDTH + 'px'
const CELL_HEIGHT = 25
const CELL_HEIGHT_PX = CELL_HEIGHT + 'px'

const INDEX_CELL_WIDTH = 80
const INDEX_CELL_WIDTH_PX = INDEX_CELL_WIDTH + 'px'
const INDEX_CELL_HEIGHT = 25
const INDEX_CELL_HEIGHT_PX = INDEX_CELL_HEIGHT + 'px'

const IDENTIFIER_CELLS = {}

const Table = styled.table`
  // width & height for the outer most cells with the 'index' (A, B, C...; 1, 2, 3...)
  th {
    width: ${INDEX_CELL_WIDTH_PX};
    height: ${INDEX_CELL_HEIGHT_PX};
  }

  // the left-most and top-most cell (0/0 technically; the one with the '/').
  // This needs to have both width & height from the index_cell constants instead of only one of them
  th.border.border-left-top {
    width: ${INDEX_CELL_WIDTH_PX};
    height: ${INDEX_CELL_HEIGHT_PX};
  }

  // **top-most row**
  // settings the width to the default cell width (because this has to fit to the normal cells)
  // but setting the height to the index cell height (this does not have to fit to the normal cells)
  th.border.border-top {
    width: ${CELL_WIDTH_PX};
    height: ${INDEX_CELL_HEIGHT_PX};
  }

  // **left-most row**
  // setting the height to the default cell height (because this has to fit to the normal cells)
  // but setting the width to the index cell width (this does not have t ofit to the normal cells)
  th.border.border-left {
    width: ${INDEX_CELL_WIDTH_PX};
    height: ${CELL_HEIGHT_PX}
  }

  // width & height for all other cells
  tr > td {
    width: ${CELL_WIDTH_PX};
    height: ${CELL_HEIGHT_PX};
  }
`

export default class Spreadsheet extends Component {
  constructor(props) {
    super(props)

    this.data = this.props.data
    this.columns = this.data[0].length
    this.rows = this.data.length

    this.update = this.update.bind(this)
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

    const g = (cell, call_cell, byRender=false, rec_call_cell) => {
      //console.log(cell, call_cell, byRender, rec_call_cell)
      let s
      if(cell.indexOf('.') === -1) {
        const match = cell.match(/^([a-zA-Z])+([0-9]+)$/)
        if(match) {
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

      if(c.tp === 'EMPTY') return ''
      if(c.tp === 'STRING') return c.vl
      if(c.tp === 'NUMBER') {

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
              this.data[s[0]][s[1]]._vl = c.fn(id => g(id, call_cell, false, c.id))
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
    const editable = ((cell.tp === 'NUMBER' || cell.tp === 'STRING') && cell.fn === undefined)
    const cb = (value) => {
      if(this.data[s[0]][s[1]].tp === 'NUMBER')
        this.data[s[0]][s[1]].vl = parseFloat(value)
      else if(this.data[s[0]][s[1]].tp === 'STRING')
        this.data[s[0]][s[1]].vl = value
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
      raw_data={v}
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
      <Table className="table">
        <tbody>
          <tr id={'r0l'} key={'r0l'}>
            <th className="border border-left-top" id={'c0r0_'} key={'c0r0_'}>{'/'}</th>
            {range(this.columns).map(x =>
                <Cell key={'c' + x + '_'} id={'c' + x + '_'} className="border-top" content={Alphabet[x]} isBorder={true} />
            )}
          </tr>
          {range(this.rows).map(x =>
            <tr id={'r' + x} key={'r' + x}>
              <Cell key={'r' + x + '_'} id={'r' + x + '_'} className="border-left" content={x+1} isBorder={true} />
              {range(this.columns).map(y => this.render_cell(this.data[x][y]))}
            </tr>
          )}
        </tbody>
      </Table>
      <div className="selection" ref={x => this.selectionElement = x} style={{
        width:  ((Math.abs(this.state.selection.start_x - this.state.selection.end_x) * CELL_WIDTH) + CELL_WIDTH) + 'px',
        height: ((Math.abs(this.state.selection.start_y - this.state.selection.end_y) * CELL_HEIGHT) + CELL_HEIGHT) + 'px',
        left: ((Math.min(this.state.selection.start_x, this.state.selection.end_x) * CELL_WIDTH) + INDEX_CELL_WIDTH) + 'px',
        top: ((Math.min(this.state.selection.start_y, this.state.selection.end_y) * CELL_HEIGHT) + INDEX_CELL_HEIGHT) + 'px',
      }} />
      </div>
    )
  }
}
