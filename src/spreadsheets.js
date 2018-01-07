import React, { Component } from 'react'
import styled from 'styled-components'

import Globals from '../components/Globals.js'
import Header from '../components/Header.js'
import Footer from '../components/Footer.js'
import Main from '../components/Main.js'
import Display from '../components/Display.js'
import Spreadsheet from '../components/Spreadsheet.js'
import Editable from '../components/Editable.js'

const color = {
  bg: 'white',
  text: 'black'
}

const SpreadsheetPage = styled.div`
  background-color: ${color.bg};
  color: ${color.text};

  h4::before {
    content: "";
    display: inline-block;
    position: relative;
    width: 10px;
    height: 20px;
    top: 4px;
    margin-right: 6px;
    margin-left: 10px;
    background-color: #e2e2e2
  }
`

export default class SpreadsheetsPage extends Component {
  constructor(props) {
    super(props)

    this.spreadsheet1 = {
      options: {
        rounding: 2
      },
      data: [
        [{id: '0.0', tp: 'STRING', vl: 'MEK'}, {id: '0.1', tp: 'EMPTY'}, {id: '0.2', tp: 'NUMBER', vl: 650}],
        [{id: '1.0', tp: 'STRING', vl: 'MGK'}, {id: '1.1', tp: 'NUMBER', vl: 0.4506, stp: 'PERCENTAGE'}, {id: '1.2', tp: 'NUMBER', fn: g => g('0.2') * g('1.1')}],
        [{id: '2.0', tp: 'STRING', vl: 'MK'}, {id: '2.1', tp: 'EMPTY'}, {id: '2.2', tp: 'NUMBER', fn: g => g('0.2') + g('1.2')}],
        [{id: '3.0', tp: 'STRING', vl: 'FEK'}, {id: '3.1', tp: 'EMPTY'}, {id: '3.2', tp: 'NUMBER', vl: 400}],
        [{id: '4.0', tp: 'STRING', vl: 'FGK'}, {id: '4.1', tp: 'NUMBER', vl: 2.381, stp: 'PERCENTAGE'}, {id: '4.2', tp: 'NUMBER', fn: g => g('3.2') * g('4.1')}],
        [{id: '5.0', tp: 'STRING', vl: 'FK'}, {id: '5.1', tp: 'EMPTY'}, {id: '5.2', tp: 'NUMBER', fn: g => g('3.2') + g('4.2')}],
        [{id: '6.0', tp: 'STRING', vl: 'HK-Prod'}, {id: '6.1', tp: 'EMPTY'}, {id: '6.2', tp: 'NUMBER', fn: g => g('2.2') + g('5.2')}],
        [{id: '7.0', tp: 'STRING', vl: 'Mehrung'}, {id: '7.1', tp: 'EMPTY'}, {id: '7.2', tp: 'NUMBER', vl: -130}],
        [{id: '8.0', tp: 'STRING', vl: 'Minderung'}, {id: '8.1', tp: 'EMPTY'}, {id: '8.2', tp: 'NUMBER', vl: 0}],
        [{id: '9.0', tp: 'STRING', vl: 'HK-Ums'}, {id: '9.1', tp: 'EMPTY'}, {id: '9.2', tp: 'NUMBER', fn: g => g('6.2') + g('7.2') + g('8.2')}],
        [{id: '10.0', tp: 'STRING', vl: 'VwGK'}, {id: '10.1', tp: 'NUMBER', vl: 0.2018, stp: 'PERCENTAGE'}, {id: '10.2', tp: 'NUMBER', fn: g => g('9.2') * g('10.1')}],
        [{id: '11.0', tp: 'STRING', vl: 'VtGK'}, {id: '11.1', tp: 'NUMBER', vl: 0.2499, stp: 'PERCENTAGE'}, {id: '11.2', tp: 'NUMBER', fn: g => g('9.2') * g('11.1')}],
        [{id: '12.0', tp: 'STRING', vl: 'SK'}, {id: '12.1', tp: 'EMPTY'}, {id: '12.2', tp: 'NUMBER', fn: g => g('9.2') + g('10.2') + g('11.2')}]
      ],
      cb: (data, update) => {
        this.spreadsheet1.data = data
        this.spreadsheet1.update = update
      }
    }

    this.spreadsheet2 = {
      options: {
        rounding: 2
      },
      data: [
        [{id: '0.0', tp: 'STRING', vl: 'SK'}, {id: '0.1', tp: 'EMPTY'}, {id: '0.2', tp: 'NUMBER', vl: 104.19}],
        [{id: '1.0', tp: 'STRING', vl: 'Gewinn'}, {id: '1.1', tp: 'NUMBER', vl: 0.15, stp: 'PERCENTAGE'}, {id: '1.2', tp: 'NUMBER', fn: g => g('0.2') * g('1.1')}],
        [{id: '2.0', tp: 'STRING', vl: 'BVP'}, {id: '2.1', tp: 'EMPTY'}, {id: '2.2', tp: 'NUMBER', fn: g => g('0.2') + g('1.2')}],
        [{id: '3.0', tp: 'STRING', vl: 'K-Skonto'}, {id: '3.1', tp: 'NUMBER', vl: 0.03, stp: 'PERCENTAGE'}, {id: '3.2', tp: 'NUMBER', fn: g => g('5.2') * g('3.1')}],
        [{id: '4.0', tp: 'STRING', vl: 'V-Provision'}, {id: '4.1', tp: 'NUMBER', vl: 0.02, stp: 'PERCENTAGE'}, {id: '4.2', tp: 'NUMBER', fn: g => g('5.2') * g('4.1')}],
        [{id: '5.0', tp: 'STRING', vl: 'ZVP'}, {id: '5.1', tp: 'EMPTY'}, {id: '5.2', tp: 'NUMBER', fn: g => g('2.2') / (1 - (g('3.1') + g('4.1')))}],
        [{id: '6.0', tp: 'STRING', vl: 'K-Rabatt'}, {id: '6.1', tp: 'NUMBER', vl: 0.03, stp: 'PERCENTAGE'}, {id: '6.2', tp: 'NUMBER', fn: g => g('7.2') * g('6.1')}],
        [{id: '7.0', tp: 'STRING', vl: 'LVP(NVP)'}, {id: '7.1', tp: 'EMPTY'}, {id: '7.2', tp: 'NUMBER', fn: g => g('5.2') / (1 - g('6.1'))}],
      ],
      cb: (data, update) => {
        this.spreadsheet2.data = data,
        this.spreadsheet2.update = update
      }
    }
  }

  render() {
    return (
      <SpreadsheetPage>
        <Globals pathname={'/spreadsheets'} />
        <Header
          left={[{url: '/', name: 'home'}, {url: '/about', name: 'about'}, {url: '/projects', name: 'projects'}]}
          right={[{url: 'https://github.com/JannikWibker/website-v2', name: '(src)'}, {url: '/', name: 'Jannik Wibker'}]}
          color={color.bg} />
              <h4>Betriebsaberechnungsbogen - Selbstkosten Produkt</h4>
              <Spreadsheet options={this.spreadsheet1.options} data={this.spreadsheet1.data} cb={this.spreadsheet1.cb} />
              {/*<button onClick={() => {
                this.spreadsheet1.data[3][2].vl = this.spreadsheet1.data[3][2].vl === 400 ? 800 : 400
                this.spreadsheet1.update('3.2')
                this.forceUpdate()
              }}>change C4 to '{this.spreadsheet1.data[3][2].vl === 400 ? 800 : 400}'</button>*/}

              <h4>Betriebsaberechnungsbogen - Listenverkaufspreis</h4>

              <Spreadsheet options={this.spreadsheet2.options} data={this.spreadsheet2.data} cb={this.spreadsheet2.cb} />
              {/*<button onClick={() => {
                this.spreadsheet2.data[1][1].vl = this.spreadsheet2.data[1][1].vl === 0.15 ? 0.2 : 0.15
                this.spreadsheet2.update('1.1')
                this.forceUpdate()
              }}>change B2 to '{this.spreadsheet2.data[1][1].vl === 0.15 ? 0.2 : 0.15}'</button>*/}
          <Footer color={color.bg} />
      </SpreadsheetPage>
    )
  }
}
