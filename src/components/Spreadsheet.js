import React, { Component } from 'react'
import styled from 'styled-components'

import Cell from './Cell.js'
import marked from '../util/inline-markdown.js'

const Table = styled.table`
  font-size: 14px;
  border-spacing: 0px;
  color: #000;
  border-width: 0 0 1px 1px;
  border-style: solid;
  border-color: #cacaca;
  table-layout: fixed;

  th, tr > td {
    position: relative;
    display: inline-block;
    box-sizing: border-box;
    width: 80px;
    height: 25px;
    margin: 0px;
    padding: 0px;
    border-width: 1px 1px 0 0;
    border-style: solid;
    border-color: #cacaca;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  th > div, td > div {
    height: 100%;
  }

  th > div > span, td > div > span {
    line-height: 15px;
    display: inline-block;
    width: calc(100% - 8px);
    height: calc(100% - 8px);
    padding: 4px;
  }

  td.selected {
    border: 2px solid #1e6337;
  }

  td.selected span {
    padding: 3px 3px 3px 2px;
  }
`

const Selection = styled.div`
  border: 2px solid rgba(248,28,229,1);
  margin: -2px 0 0 -2px;
  position: absolute;
  pointer-events: none;
  background-color: rgba(248,28,229,0.1);
`

const isInViewport = (element, offset=40) => {
  let rect = element.getBoundingClientRect()
  return (
    rect.top >= (0 + offset) &&
    rect.left >= (0 + offset) &&
    rect.bottom <= ((window.innerHeigth || document.documentElement.clientHeight) - offset) &&
    rect.right <= ((window.innerWidth || document.documentElement.clientWidth) - offset)
  )
}

const scrollIntoViewIfNeeded = (element) =>
  !isInViewport(element)
    ? element.scrollIntoView({behavior: 'smooth', block: 'center'})
    : null

const round = (number, decimals) => Number(Math.round(number + 'e' + decimals) + 'e-' + decimals)

const format_data = (data, tp, stp, r_dec) => {
  if(typeof data === 'undefined') throw Error('no data defined')
  else if(typeof tp === 'undefined') throw Error('no type defined')
  if(tp === 'NUMBER') {
    if(stp === 'PERCENTAGE' && r_dec) return round(data * 100, r_dec) + '%'
    if(stp === 'PERCENTAGE') return (data * 100) + '%'
    if(r_dec) return round(data, r_dec)
    else return data
  } else if(tp === 'STRING') {
    if(stp === 'UPPERCASE') return marked.inlineLexer(data.toUpperCase(), {}, {})
    if(stp === 'LOWERCASE') return marked.inlineLexer(data.toLowerCase(), {}, {})
    else return marked.inlineLexer(String(data), {}, {})
  } else {
    return data
  }
}

const range = (l) => [...Array(l)].map((x,i) => i)

const destructur = (obj, template) => {
  let _obj = {}
  if(Array.isArray(template)) {
    template.forEach(key => _obj[key] = obj[key])
  } else {
    Object.keys(template).forEach(key => _obj[template[key]] = obj[key])
  }
  return _obj
}

const default_value = tp => {
  if(tp === 'STRING') return ''
  if(tp === 'NUMBER') return 0
}

export default class Spreadsheet extends Component {
  constructor(props) {
    super(props)

    this.data = this.props.data
    this.columns = this.data[0].length
    this.rows = this.data.length

    this.update = this.update.bind(this)
    this._update = this._update.bind(this)

    this.props.cb(this.data, this.update)

    this.alphabet = 'ABCDEFGHIJKLNMOPQRSTUVWXYZ'.split('')
    this._alphabet = 'abcdefghijklnmopqrstuvwxyz'.split('')

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
      const s = cell.split('.')
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


          console.log(destructur(this.data[rcs[0]][rcs[1]], ['id', 'changes', 'visited']), destructur(this.data[s[0]][s[1]], ['id', 'changes', 'visited']))
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

  render() {
    return (
      <div style={{
        width: ((this.data[0].length + 1) * 80) + 'px',
        height: ((this.data.length + 1) * 25) + 'px'
      }}>
      <Table>
        <tbody>
          <tr id={'r0l'} key={'r0l'}>
            <th id={'c0r0_'} key={'c0r0_'}>{'/'}</th>
            {range(this.columns).map(x => <Cell key={'c' + x + '_'} id={'c' + x + '_'} content={this.alphabet[x]} isBorder={true} />)}
          </tr>
          {range(this.rows).map(x =>
            <tr id={'r' + x} key={'r' + x}>
              <Cell key={'r' + x + '_'} id={'r' + x + '_'} content={x+1} isBorder={true} />
              {range(this.columns).map(y => this.render_cell(this.data[x][y]))}
            </tr>
          )}
        </tbody>
      </Table>
      <Selection innerRef={x => this.selectionElement = x} style={{
        width:  ((Math.abs(this.state.selection.start_x - this.state.selection.end_x) * 80) + 80) + 'px',
        height: ((Math.abs(this.state.selection.start_y - this.state.selection.end_y) * 25) + 25) + 'px',
        left: ((Math.min(this.state.selection.start_x, this.state.selection.end_x) * 80) + 80) + 'px',
        top: ((Math.min(this.state.selection.start_y, this.state.selection.end_y) * 25) + 25) + 'px',
      }}></Selection>
      </div>
    )
  }
}
