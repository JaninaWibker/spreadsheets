import React, { Component } from 'react'
import Spreadsheet from './components/Spreadsheet.js'
import './css/index.css'

import { /*range, createCell, createEmptyCell,*/ createStringCell, /*createNumberCell, createRow, createCol,*/ createTable, fillTableEmpty, fillTableIds, CELL_TYPE } from './util/helpers.js'
import parse_file from './util/file-parser.js'

const file_demo_spreadsheet = parse_file(`
---
number.rounding: 2
cell.width: 224
cell.height: 25
index_cell.width: 80
index_cell.height: 25
---
[{ "tp": "S", "vl": "**test2**", "style": { "fontFamily": "Menlo" } }, { "tp": "N", "vl": 5, "name": "thisIsSomeName" } ]
[{ "tp": "S", "vl": "\`123\`: blub" }, { "tp": "N", "vl": "=A1:A1" } ]
[ { "tp": "S", "vl": "=pi" }, { "tp": "N", "vl": "=thisIsSomeName" } ]
[ { "tp": "E" }, { "tp": "S", "vl": "=IF(B1 > 5, \\"true\\", \\"false\\")", "name": "blub" } ]`)

const demo_spreadsheet = {
  options: {
    rounding: 2,
    x_default: [{ width: 120 }],
    y_default: [{ height: 25 }],
    x: [null, { width: 100 }],
    y: [null, { height: 25 }]
  },
  // data: createTable(0, 0, 26, 28, createStringCell([null, null], "")),
  // data: fillTableIds(4, 2, fillTableEmpty(4, 2, [
  //   [{tp: CELL_TYPE.STRING, vl: '**test**', style: {fontFamily: 'Menlo'}}, {tp: CELL_TYPE.NUMBER, vl: 5, name: 'thisIsSomeName'}],
  //   [{tp: CELL_TYPE.STRING, vl: '`123`: blub'},                            {tp: CELL_TYPE.NUMBER, vl: '=A1:A1'}],
  //   [{tp: CELL_TYPE.STRING, vl: '=pi'}],
  //   [{tp: CELL_TYPE.EMPTY},                                                {tp: CELL_TYPE.STRING, vl: '=IF(B1 > 5, "true", "false")', name: 'blub'}],
  // ])),
  data: fillTableIds(4, 2, fillTableEmpty(4, 2, [
    [{tp: CELL_TYPE.NUMBER, vl: 5},     {tp: CELL_TYPE.NUMBER, vl: '=A1'}],
    [{tp: CELL_TYPE.NUMBER, vl: '=B1'}, {tp: CELL_TYPE.NUMBER, vl: '=B3'}],
    [{tp: CELL_TYPE.NUMBER, vl: '=A3'}, {tp: CELL_TYPE.NUMBER, vl: 0}],
    [{tp: CELL_TYPE.NUMBER, vl: 0},     {tp: CELL_TYPE.STRING, vl: '=IF(B1 > 5, "true", "false")', name: 'blub'}],
  ])),
  name: 'demo_spreadsheet'
}

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      spreadsheet: demo_spreadsheet,
      cb: (data, update) => {
        console.log(data, update)
        this.state.spreadsheet.data = data
        this.state.update = update
      }
    }
  }

  loadSpreadsheet(options, data, name) {
    console.log({
      spreadsheet: { options, data, name }
    })
    this.setState({
      spreadsheet: { options, data, name }
    })
  }

  render() {
    return (
      <div>
        <div className="spreadsheet-wrapper">
          <Spreadsheet
            options={this.state.spreadsheet.options}
            data={this.state.spreadsheet.data}
            name={this.state.spreadsheet.name}
            cb={this.state.cb} />
        </div>
        <button onClick={() => this.loadSpreadsheet(...Object.values(file_demo_spreadsheet), 'file_demo_spreadsheet')}>load other spreadsheet</button>
      </div>
    )
  }
}

export default App
