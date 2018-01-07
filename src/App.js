import React, { Component } from 'react'
import styled from 'styled-components'
import Spreadsheet from './components/Spreadsheet.js'

const SpreadsheetWrapper = styled.div`
  table {
    display: block;
    overflow: auto;
    white-space: nowrap;
  }
`

const range = (l) => [...Array(l)].map((x,i) => i)

const createCell = (id, tp='STRING', vl='', stp, fn) => ({ id, tp, stp, vl, fn })

const createStringCell = (id, vl, fn, stp) => createCell(id, 'STRING', vl, stp, fn)
const createNumberCell = (id, vl, fn, stp) => createCell(id, 'NUMBER', vl, stp, fn)

const createRow = (start, end, col, cell) =>
  range(end-start)
    .map(x => x + start)
    .map(x => cell
      ? createCell('' + col + '.' + x, cell.tp, cell.vl, cell.stp, cell.fn)
      : createCell('' + col + '.' + x)
    )

const createCol = (start, end, row, cell) =>
  range(end-start)
    .map(x => x + start)
    .map(x => cell
      ? createCell('' + x + '.' + row, cell.tp, cell.vl, cell.stp, cell.fn)
      : createCell('' + x + '.' + row))

const createTable = (start_x, start_y, end_x, end_y, cell) =>
  range(end_y - start_y)
    .map(x => x + start_y)
    .map(x => createRow(start_x, end_x, x, cell))

class App extends Component {
  constructor(props) {
    super(props)

    this.spreadsheet = {
      options: {
        rounding: 2
      },
      // data: [
      //   [{id: '0.0', tp: 'STRING', vl: 'MEK'}, {id: '0.1', tp: 'EMPTY'}, {id: '0.2', tp: 'NUMBER', vl: 650}],
      //   [{id: '1.0', tp: 'STRING', vl: 'MGK'}, {id: '1.1', tp: 'NUMBER', vl: 0.4506, stp: 'PERCENTAGE'}, {id: '1.2', tp: 'NUMBER', fn: g => g('0.2') * g('1.1')}],
      //   [{id: '2.0', tp: 'STRING', vl: 'MK'}, {id: '2.1', tp: 'EMPTY'}, {id: '2.2', tp: 'NUMBER', fn: g => g('0.2') + g('1.2')}],
      //   [{id: '3.0', tp: 'STRING', vl: 'FEK'}, {id: '3.1', tp: 'EMPTY'}, {id: '3.2', tp: 'NUMBER', vl: 400}],
      //   [{id: '4.0', tp: 'STRING', vl: 'FGK'}, {id: '4.1', tp: 'NUMBER', vl: 2.381, stp: 'PERCENTAGE'}, {id: '4.2', tp: 'NUMBER', fn: g => g('3.2') * g('4.1')}],
      //   [{id: '5.0', tp: 'STRING', vl: 'FK'}, {id: '5.1', tp: 'EMPTY'}, {id: '5.2', tp: 'NUMBER', fn: g => g('3.2') + g('4.2')}],
      //   [{id: '6.0', tp: 'STRING', vl: 'HK-Prod'}, {id: '6.1', tp: 'EMPTY'}, {id: '6.2', tp: 'NUMBER', fn: g => g('2.2') + g('5.2')}],
      //   [{id: '7.0', tp: 'STRING', vl: 'Mehrung'}, {id: '7.1', tp: 'EMPTY'}, {id: '7.2', tp: 'NUMBER', vl: -130}],
      //   [{id: '8.0', tp: 'STRING', vl: 'Minderung'}, {id: '8.1', tp: 'EMPTY'}, {id: '8.2', tp: 'NUMBER', vl: 0}],
      //   [{id: '9.0', tp: 'STRING', vl: 'HK-Ums'}, {id: '9.1', tp: 'EMPTY'}, {id: '9.2', tp: 'NUMBER', fn: g => g('6.2') + g('7.2') + g('8.2')}],
      //   [{id: '10.0', tp: 'STRING', vl: 'VwGK'}, {id: '10.1', tp: 'NUMBER', vl: 0.2018, stp: 'PERCENTAGE'}, {id: '10.2', tp: 'NUMBER', fn: g => g('9.2') * g('10.1')}],
      //   [{id: '11.0', tp: 'STRING', vl: 'VtGK'}, {id: '11.1', tp: 'NUMBER', vl: 0.2499, stp: 'PERCENTAGE'}, {id: '11.2', tp: 'NUMBER', fn: g => g('9.2') * g('11.1')}],
      //   [{id: '12.0', tp: 'STRING', vl: 'SK'}, {id: '12.1', tp: 'EMPTY'}, {id: '12.2', tp: 'NUMBER', fn: g => g('9.2') + g('10.2') + g('11.2')}]
      // ],
      data: createTable(0, 0, 26, 28, createStringCell(null, "")),
      cb: (data, update) => {
        this.spreadsheet.data = data
        this.spreadsheet.update = update
      }
    }
  }

  render() {
    return (
      <div>
        <SpreadsheetWrapper>
          <Spreadsheet
            options={this.spreadsheet.options}
            data={this.spreadsheet.data}
            cb={this.spreadsheet.cb} />
        </SpreadsheetWrapper>
      </div>
    )
  }
}

export default App
