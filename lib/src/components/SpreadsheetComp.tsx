import React, { Component } from 'react'

import { BorderCell, Cell as NormalCell } from './Cell'
import Selection, { handleKeypress as handleSelectionKeypress, handleMouseSelection, convert_to_selection_coordinates } from './Selection'
import ContextMenu from './ContextMenu/ContextMenu'
import ColorPickerMenuEntry from './ContextMenu/ColorPickerMenuEntry'
import platform_detection from '../util/platform-detection'
import { range, format_data, compare_cell_ids, is_inside_selection, get_csv_from_cells } from '../util/helpers'
import { generate_col_id_format } from '../util/cell_id'
import { get_cell } from '../util/cell_transform'
import { update, handleCellChange, change_cell_types } from '../util/spreadsheet'
import { CellType } from '../types/CellTypes'
import type { getCellCurried } from '../util/cell_transform'
import type { Cell, CellId, Spreadsheet } from '../types/Spreadsheet'
import type { AdvancedEntry, Entry } from '../types/ContextMenu'
import type { Modifiers, ModifiersPlatformAdjusted, FakeMouseEvent } from '../types/Events'

import { Check, Clipboard, Copy, Delete, Scissors, Type, Play } from '../icons/index'

import { lib } from '../util/stdlib'

import '../css/spreadsheet.css'

// constants for width/height of cells
const CELL_WIDTH = 224 // TODO: apparently this should be configurable via this.props.options (don't know if this is really needed though)
const CELL_HEIGHT = 25

const BORDER_CELL_WIDTH = 80
const BORDER_CELL_HEIGHT = 25

// settings associated css variables in order to be able to access these constants from within css
document.documentElement.style.setProperty('--cell-width-px', CELL_WIDTH + 'px')
document.documentElement.style.setProperty('--cell-height-px', CELL_HEIGHT + 'px')

document.documentElement.style.setProperty('--border-cell-width-px', BORDER_CELL_WIDTH + 'px')
document.documentElement.style.setProperty('--border-cell-height-px', BORDER_CELL_HEIGHT + 'px')

type SpreadsheetProps = {
  spreadsheet: Spreadsheet
}

type SpreadsheetState = {
  selection: {
    start_x: number,
    start_y: number,
    end_x: number,
    end_y: number
    // _start_x: number,
    // _start_y: number,
    // _end_x: number,
    // _end_y: number
  },
  focused: {
    x: number,
    y: number
  },
  context_menu_entries: Entry[],
  context_menu_ref: Element | null
}

export class SpreadsheetComp extends Component<SpreadsheetProps, SpreadsheetState> {
  spreadsheet: Spreadsheet
  g: getCellCurried

  state: SpreadsheetState = {
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
    context_menu_entries: [],
    context_menu_ref: null
  }

  constructor(props: SpreadsheetProps) {
    super(props)
    this.spreadsheet = props.spreadsheet
    this.g = get_cell(lib, this.spreadsheet)
  }

  componentDidMount() {
    // this needs to be called once after the component was created
    // another solution is to call notifyUpdate in the constructor,
    // then componentDidUpdate is triggered which then even though
    // it doesn't even enter the if statement somehow re-renders
    // the data
    this.forceUpdate()
  }

  componentDidUpdate() {
    // this branch is only taken when the spreadsheet as a whole changes
    if (this.spreadsheet.name !== this.props.spreadsheet.name) {
      // no need to call transform_spreadsheet as this is already done by the code using <SpreadsheetComp />
      this.spreadsheet = this.props.spreadsheet

      // need to update the way to look up cells
      this.g = get_cell(lib, this.spreadsheet)

      // forcing an update as state is managed manually
      this.forceUpdate()
    }
  }

  private update = (cell_id: CellId) => {
    update(this.spreadsheet, cell_id)
    this.forceUpdate()
  }

  private openContextMenu = (ref: HTMLElement | null, menu: Entry[]) => {
    this.setState({
      context_menu_entries: menu,
      context_menu_ref: ref
    })
  }

  private closeContextMenu = () => {
    this.setState({
      context_menu_entries: [],
      context_menu_ref: null
    })
  }

  private generateCsvFromCells = (cells: CellId[][]) => {
    return get_csv_from_cells(
      cells.map(row => row.map(([row, col]) => this.spreadsheet.data[row][col]))
    )
  }

  private onCopyToClipboard = (cells: CellId[][]) => {
    console.log('copy', cells)

    navigator.clipboard.writeText(this.generateCsvFromCells(cells))
      .catch(err => console.error('couldn\'t copy to clipboard', err))
  }

  private onPasteFromClipboard = (cells: CellId[][]) => {
    // TODO: this requires permissions and might be a bit annoying to do
    // TODO: pasting from csv format, need to parse csv and check if selection matches size
    // TODO: if not; just paste it starting from the top-left corner (so basically not dependent on size altogether)
    console.log('paste', cells)
  }

  private onCutToClipboard = (cells: CellId[][]) => {
    console.log('cut', cells)
    navigator.clipboard.writeText(this.generateCsvFromCells(cells))
      .then(() => this.onClearCells(cells))
      .catch(err => console.error('couldn\'t copy to clipboard', err))
  }

  private onClearCells = (cells: CellId[][]) => {
    // TODO: clear all cells
    console.log('clear', cells)
  }

  private onChangeCellType = (type: CellType, cells: CellId[][]) => {
    change_cell_types(this.spreadsheet, cells, type)
    console.log('cell_type->' + type, cells)
  }

  private onChangeCellTextColor = (cells: CellId[][], color: string | undefined) => {
    if (color === undefined) return // TODO: should this clear the color?
    cells.forEach(row => row.forEach(([row, col]) => {
      const cell = this.spreadsheet.data[row][col]
      cell.style = { ...cell.style, color }
    }))
    console.log('text_color->' + color, cells)
    this.forceUpdate()
  }

  private onChangeCellBackgroundColor = (cells: CellId[][], color: string | undefined) => {
    if (color === undefined) return // TODO: should this clear the color?
    cells.forEach(row => row.forEach(([row, col]) => {
      const cell = this.spreadsheet.data[row][col]
      cell.style = { ...cell.style, backgroundColor: color }
    }))
    console.log('background_color->' + color, cells)
    this.forceUpdate()
  }

  handleCellMouseEvents = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, id: string) => {
    const [row_str, col_str] = id.split('.')
    const row = parseInt(row_str, 10)
    const col = parseInt(col_str, 10)
    const whole_row = col_str === '_' // if column is unspecified it means whole row
    const whole_col = row_str === '_' // if row is unspecified it means whole column

    const modifiers: ModifiersPlatformAdjusted = (({ shiftKey, altKey, metaKey, ctrlKey }) => ({
      shift: shiftKey, alt: altKey, meta: metaKey, ctrl: ctrlKey, mod: platform_detection.isMacOrIos() ? metaKey : ctrlKey
    }))(e)

    const fake_event = { type: e.type as FakeMouseEvent['type'], buttons: e.buttons, button: e.button, modifiers, preventDefault: e.preventDefault.bind(e), target: e.target }

    switch (e.type) {
      case 'click':
      case 'mousedown':
      case 'mouseup':
      case 'mouseenter': return this.handleMouseSelection(fake_event, [row, col], [whole_row, whole_col])
      case 'contextmenu': return this.handleMouseContextMenu(fake_event, [row, col], [whole_row, whole_col])
      default: throw new Error('unknown event sent to handleCellMouseEvents')
    }
  }

  private handleMouseContextMenu = (e: { type: string, buttons: number, button: number, modifiers: Modifiers, preventDefault: () => void, target: EventTarget }, [row, col]: CellId, [whole_row, whole_col]: [boolean, boolean]) => {
    if (whole_row || whole_col) return

    const cell = this.spreadsheet.data[row][col]

    const cell_type_icons = [<div key={1} />, <div key={2} />, <div key={3} />]

    switch (cell.tp) {
      case CellType.NUMBER: cell_type_icons[0] = <Check />; break
      case CellType.STRING: cell_type_icons[1] = <Check />; break
      case CellType.EMPTY: cell_type_icons[2] = <Check />; break
      default: throw new Error('forgot to add new cell type to switch statement')
    }

    e.preventDefault()

    this.setState({ context_menu_ref: e.target as Element })

    let cells: CellId[][]

    if (is_inside_selection(this.state.selection, [row, col])) {
      cells = []
      const start_x = Math.min(this.state.selection.start_x, this.state.selection.end_x)
      const end_x = Math.max(this.state.selection.start_x, this.state.selection.end_x)
      const start_y = Math.min(this.state.selection.start_y, this.state.selection.end_y)
      const end_y = Math.max(this.state.selection.start_y, this.state.selection.end_y)
      for (let row = start_y; row <= end_y; row++) {
        cells[row - start_y] = []
        for (let col = start_x; col <= end_x; col++) {
          cells[row - start_y].push([row, col])
        }
      }
    } else {
      cells = [[[row, col]]]
    }

    const menu = [
      { key: 'copy', submenu: false, simple: true, name: 'Copy', action: () => this.onCopyToClipboard(cells), shortcut: ['mod', 'c'], icon: <Copy /> },
      { key: 'paste', submenu: false, simple: true, name: 'Paste', action: () => this.onPasteFromClipboard(cells), shortcut: ['mod', 'v'], icon: <Clipboard /> },
      { key: 'cut', submenu: false, simple: true, name: 'Cut', action: () => this.onCutToClipboard(cells), shortcut: ['mod', 'x'], icon: <Scissors /> },
      { key: 'clear', submenu: false, simple: true, name: 'Clear cell', action: () => this.onClearCells(cells), shortcut: ['backspace'], icon: <Delete /> },
      {
        key: 'cell_type',
        submenu: true,
        simple: true,
        name: 'Cell Type',
        menu: [
          { key: 'number', submenu: false, simple: true, name: 'Number', action: () => this.onChangeCellType(CellType.NUMBER, cells), icon: cell_type_icons[0] },
          { key: 'string', submenu: false, simple: true, name: 'String', action: () => this.onChangeCellType(CellType.STRING, cells), icon: cell_type_icons[1] },
          { key: 'empty', submenu: false, simple: true, name: 'Empty', action: () => this.onChangeCellType(CellType.EMPTY, cells), icon: cell_type_icons[2] },
        ],
        expand_icon: <Play fill={true} />
      },
      {
        key: 'text-color',
        submenu: true,
        simple: false,
        component: (entry: AdvancedEntry, close: () => void, register_submenu: (submenu: { is_open: boolean, close: () => void }) => number, notify_open_submenu: (idx: number, is_open: boolean) => void) =>
          <ColorPickerMenuEntry text="Text color" key={entry.key} color={undefined} cb={color => this.onChangeCellTextColor(cells, color)} close={close} register_submenu={register_submenu} notify_open_submenu={notify_open_submenu} />
      },
      {
        key: 'background-color',
        submenu: true,
        simple: false,
        component: (entry: AdvancedEntry, close: () => void, register_submenu: (submenu: { is_open: boolean, close: () => void }) => number, notify_open_submenu: (idx: number, is_open: boolean) => void) =>
          <ColorPickerMenuEntry text="Background color" key={entry.key} color={undefined} cb={color => this.onChangeCellBackgroundColor(cells, color)} close={close} register_submenu={register_submenu} notify_open_submenu={notify_open_submenu} />
      },
      { key: 'name', submenu: false, simple: true, name: 'Set name', icon: <Type /> },
    ]

    this.openContextMenu(e.target as HTMLElement, menu)
  }

  private handleMouseSelection = (e: FakeMouseEvent, cell_id: CellId, whole_row_col: [boolean, boolean]) => {
    if (e.buttons === 2 || e.button === 2) return // block right-clicking

    const dimensions = {
      x: this.spreadsheet.data[0].length, // columns
      y: this.spreadsheet.data.length // rows
    }

    this.setState({
      selection: handleMouseSelection(this.state.selection, dimensions, e, cell_id, whole_row_col)
    })
  }

  handleKeypress = (key: 'ArrowLeft' | 'ArrowUp' | 'ArrowRight' | 'ArrowDown', modifiers: Modifiers, preventDefault: () => void) => {
    const dimensions = {
      x: this.spreadsheet.data[0].length, // columns
      y: this.spreadsheet.data.length // rows
    }

    const { selection, focused } = handleSelectionKeypress(key, {
      ...modifiers,
      mod: platform_detection.isMacOrIos() ? modifiers.meta : modifiers.ctrl // choose appropriate modifier for platform
    }, convert_to_selection_coordinates(this.state.selection), dimensions)

    preventDefault()

    this.setState({ selection, focused }, () => {
      // if (this.selectionElement) scroll_into_view_if_needed(this.selectionElement) // TODO: what is the purpose of this exactly?; well this element SHOULD exist but somehow isn't mentioned anywhere else
    })
  }

  handleCellChange = (cell: Cell, value: string) => {
    handleCellChange(this.spreadsheet, cell, value)
    this.update(cell._id)
  }

  render_cell(cell: Cell) {
    const v = this.g(cell.id, cell._id, true, cell._id) // TODO: this might need to change when `g` changes

    let content
    if (cell.err) {
      content = cell.err.message
    } else if (cell.cycle.length === 1 || cell.refs.find(cell_id => compare_cell_ids(cell._id, cell_id))) {
      content = '#Self reference'
    } else if (cell.cycle.length > 0) {
      content = '#Circular references'
    } else {
      content = format_data(v, cell.tp, cell.stp, cell.r_dec || this.props.spreadsheet.options.rounding)
    }

    // console.log('called for cell: ' + generate_id_format(cell._id) + ' new value: ' + v)

    return (
      <NormalCell
        key={cell.row + '.' + cell.col}
        id={cell.row + '.' + cell.col}
        content={content}
        editable={cell.tp === CellType.NUMBER || cell.tp === CellType.STRING}
        style={cell.style ? cell.style : {}}
        onValueChange={this.handleCellChange.bind(this, cell)}
        onMouseEvent={this.handleCellMouseEvents}
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
    const columns = this.spreadsheet.data[0].length
    const rows = this.spreadsheet.data.length

    return (
      <div style={{
        width: ((columns * CELL_WIDTH) + BORDER_CELL_WIDTH + 1) + 'px',
        height: ((rows * CELL_HEIGHT) + BORDER_CELL_HEIGHT + 1) + 'px'
      }}>
        <table className="table">
          <tbody>
            <tr id="r0l" key="r0l">
              <BorderCell key="_._" id="_._" className="" onMouseEvent={this.handleCellMouseEvents} content="/" />
              {range(columns).map(col_num =>
                <BorderCell key={'_.' + col_num} id={'_.' + col_num} className="border-top" content={generate_col_id_format(col_num)} onMouseEvent={this.handleCellMouseEvents} />
              )}
            </tr>
            {range(rows).map(row_num => (
              <tr id={'r' + row_num} key={'r' + row_num}>
                <BorderCell key={row_num + '._'} id={row_num + '._'} className="border-left" content={String(row_num + 1)} onMouseEvent={this.handleCellMouseEvents} />
                {range(columns).map(col_num => this.render_cell(this.spreadsheet.data[row_num][col_num]))}
              </tr>
            )
            )}
          </tbody>
        </table>
        <Selection
          start={{ x: this.state.selection.start_x, y: this.state.selection.start_y }}
          end= {{ x: this.state.selection.end_x, y: this.state.selection.end_y }}
          constants={{
            cell_width: CELL_WIDTH,
            cell_height: CELL_HEIGHT,
            index_cell_width: BORDER_CELL_WIDTH,
            index_cell_height: BORDER_CELL_HEIGHT
          }}
        />
        {this.state.context_menu_ref
          ? <ContextMenu referenceElement={this.state.context_menu_ref} close={this.closeContextMenu} menu={this.state.context_menu_entries} placement="bottom" />
          : null
        }
      </div>
    )
  }
}
