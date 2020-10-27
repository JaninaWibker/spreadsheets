import React, { Component } from 'react'
import SpreadsheetComp from './components/SpreadsheetComp'
import './css/index.css'

import type { Spreadsheet } from './types/Spreadsheet'
import { CellType } from './types/CellTypes'

import { fillTableEmpty, fillTableIds } from './util/cell_creation'
import parse_file from './util/file-parser'

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
[ { "tp": "E" }, { "tp": "S", "vl": "=IF(B1 > 5, \\"true\\", \\"false\\")", "name": "blub" } ]`, 'file_demo_spreadsheet')

const demo_spreadsheet: Spreadsheet = {
  options: {
    rounding: 2,
    // x_default: [{ width: 120 }],
    // y_default: [{ height: 25 }],
    // x: [null, { width: 100 }],
    // y: [null, { height: 25 }]
  },
  // data: createTable(0, 0, 26, 28, createStringCell([null, null], "")),
  // data: fillTableIds(4, 2, fillTableEmpty(4, 2, [
  //   [{tp: CellType.STRING, vl: '**test**', style: {fontFamily: 'Menlo'}}, {tp: CellType.NUMBER, vl: 5, name: 'thisIsSomeName'}],
  //   [{tp: CellType.STRING, vl: '`123`: blub'},                            {tp: CellType.NUMBER, vl: '=A1:A1'}],
  //   [{tp: CellType.STRING, vl: '=pi'}],
  //   [{tp: CellType.EMPTY, vl: ''},                                        {tp: CellType.STRING, vl: '=IF(B1 > 5, "true", "false")', name: 'blub'}],
  // ])),
  data: fillTableIds(4, 2, fillTableEmpty(4, 2, [
    [{tp: CellType.NUMBER, vl: 5},     {tp: CellType.NUMBER, vl: '=A4'}],
    [{tp: CellType.NUMBER, vl: '=B1'}, {tp: CellType.NUMBER, vl: '=B3'}],
    [{tp: CellType.NUMBER, vl: '=A3'}, {tp: CellType.NUMBER, vl: 0}],
    [{tp: CellType.NUMBER, vl: '=COUNTIF(A1:A3, . it == 0)'},     {tp: CellType.STRING, vl: '=IF(B1 > 5, "true", "false")', name: 'blub'}],
  ])),
  name: 'demo_spreadsheet'
}

interface IProps {

}

interface IState {
  spreadsheet: Spreadsheet,
  update?: any,
  cb: any
}


class App extends Component<IProps, IState> {
  constructor(props: any) {
    super(props)

    this.state = {
      spreadsheet: demo_spreadsheet,
      cb: (data: any, update: any) => {
        console.log(data, update)
        this.setState({
          spreadsheet: { data: data, options: this.state.spreadsheet.options, name: this.state.spreadsheet.name },
          update: update
        })
      }
    }
  }

  loadSpreadsheet(spreadsheet: Spreadsheet) {
    console.log(spreadsheet)
    this.setState({
      spreadsheet: spreadsheet
    })
  }

  render() {
    return (
      <div>
        <div className="spreadsheet-wrapper">
          <SpreadsheetComp
            options={this.state.spreadsheet.options}
            data={this.state.spreadsheet.data}
            name={this.state.spreadsheet.name}
            cb={this.state.cb} />
        </div>
        <button onClick={() => this.loadSpreadsheet(file_demo_spreadsheet)}>load other spreadsheet</button>
      </div>
    )
  }
}

export default App
