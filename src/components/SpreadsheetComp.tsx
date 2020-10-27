import React, { Component } from 'react'
import '../css/spreadsheet.css'

import { BorderCell, Cell as NormalCell } from './Cell'
import Selection, { handleKeypress as handleSelectionKeypress, handleMouseSelection, convert_to_selection_coordinates } from './Selection'
import ContextMenu, { ColorPickerMenuEntry } from './ContextMenu'
import { range, format_data, scroll_into_view_if_needed, parse_formula, lookup, compute_additions_and_deletions, compare_cell_ids, is_inside_selection, get_csv_from_cells } from '../util/helpers'
import { generate_col_id_format, generate_id_format } from '../util/cell_id'
import { get_cell, transform, check_errors, check_circular_for_cell } from '../util/cell_transform'
import type { getCellCurried } from '../util/cell_transform'
import { CellType } from '../types/CellTypes'
import type { Cell, CellId, SpreadsheetOptions } from '../types/Spreadsheet'
import type { AdvancedEntry, Entry } from '../types/ContextMenu'
import type { Modifiers, ModifiersPlatformAdjusted, FakeMouseEvent } from '../types/Events'
import platform_detection from '../util/platform-detection'

import { Check, Clipboard, Copy, Delete, Scissors, Type, Play } from '../icons/index'

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
  },
  context_menu_entries: Entry[],
  context_menu_ref: EventTarget | null
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
      },
      context_menu_entries: [],
      context_menu_ref: null
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

  private _update = (cell_id: CellId) => {
    const [col, row] = cell_id
    const cell = this.data[col][row]

    this.data[col][row].visited = false
    
    if(cell.changes) {
      cell.changes // filter out cells which are also in the same cycle as the current cell // TODO: does this filter out too much?; should they be updated at least once?
        .filter(cell_id => !cell.cycle.find(cell_id_cycle => compare_cell_ids(cell_id, cell_id_cycle)))
        .forEach(this._update)
      }
  }

  private update = (cell_id: CellId) => {
    this._update(cell_id)
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
      cells.map(row => row.map(([row, col]) => this.data[row][col]))
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
    cells.forEach(row => row.forEach(([row, col]) => {
      const cell = this.data[row][col]
      const old_type = cell.tp
      cell.tp = type
      cell.stp = undefined

      if(old_type === CellType.EMPTY) {
        switch(type) {
          case CellType.NUMBER: cell.vl = 0;  break;
          case CellType.STRING: cell.vl = ''; break;
          case CellType.EMPTY: break;
          default: throw new Error('forgot to add new case to switch statement')
        }
      }
    }))
    console.log('cell_type->' + type, cells)
  }

  private onChangeCellTextColor = (cells: CellId[][], color: string | undefined) => {
    if(color === undefined) return // TODO: should this clear the color?
    cells.forEach(row => row.forEach(([row, col]) => {
      const cell = this.data[row][col]
      cell.style = { ...cell.style, color: color }
    }))
    console.log('text_color->' + color, cells)
    this.forceUpdate()
  }

  private onChangeCellBackgroundColor = (cells: CellId[][], color: string | undefined) => {
    if(color === undefined) return // TODO: should this clear the color?
    cells.forEach(row => row.forEach(([row, col]) => {
      const cell = this.data[row][col]
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

    const fake_event = { type: e.type as FakeMouseEvent["type"], buttons: e.buttons, button: e.button, modifiers: modifiers, preventDefault: e.preventDefault.bind(e), target: e.target }

    switch(e.type) {
      case 'click':
      case 'mousedown':
      case 'mouseup':
      case 'mouseenter': return this.handleMouseSelection(fake_event, [row, col], [whole_row, whole_col])
      case 'contextmenu': return this.handleMouseContextMenu(fake_event, [row, col], [whole_row, whole_col])
      default: throw new Error('unknown event sent to handleCellMouseEvents')
    }
  }

  private handleMouseContextMenu = (e: { type: string, buttons: number, button: number, modifiers: Modifiers, preventDefault: () => void, target: EventTarget }, [row, col]: CellId, [whole_row, whole_col]: [boolean, boolean]) => {
    if(whole_row || whole_col) return

    const cell = this.data[row][col]

    let cell_type_icons = [<div />, <div />, <div />]

    switch(cell.tp) {
      case CellType.NUMBER: cell_type_icons[0] = <Check />; break;
      case CellType.STRING: cell_type_icons[1] = <Check />; break;
      case CellType.EMPTY:  cell_type_icons[2] = <Check />; break;
      default: throw new Error('forgot to add new cell type to switch statement')
    }

    e.preventDefault()

    this.setState({ context_menu_ref: e.target })

    let cells: CellId[][]

    if(is_inside_selection(this.state.selection, [row, col])) {
      cells = []
      const start_x = Math.min(this.state.selection.start_x, this.state.selection.end_x)
      const end_x =   Math.max(this.state.selection.start_x, this.state.selection.end_x)
      const start_y = Math.min(this.state.selection.start_y, this.state.selection.end_y)
      const end_y =   Math.max(this.state.selection.start_y, this.state.selection.end_y)
      for(let row = start_y; row <= end_y; row++) {
        cells[row - start_y] = []
        for(let col = start_x; col <= end_x; col++) {
          cells[row - start_y].push([row, col])
        }
      }
    } else {
      cells = [[[row, col]]]
    }

    const menu = [
      { key: 'copy',      submenu: false, simple: true, name: 'Copy',       action: () => this.onCopyToClipboard(cells),     shortcut: ['mod', 'c'],   icon: <Copy /> },
      { key: 'paste',     submenu: false, simple: true, name: 'Paste',      action: () => this.onPasteFromClipboard(cells),  shortcut: ['mod', 'v'],   icon: <Clipboard /> },
      { key: 'cut',       submenu: false, simple: true, name: 'Cut',        action: () => this.onCutToClipboard(cells),      shortcut: ['mod', 'x'],   icon: <Scissors /> },
      { key: 'clear',     submenu: false, simple: true, name: 'Clear cell', action: () => this.onClearCells(cells),          shortcut: ['backspace'],  icon: <Delete /> },
      { key: 'cell_type', submenu: true,  simple: true, name: 'Cell Type', menu: [
        { key: 'number', submenu: false,  simple: true, name: 'Number', action: () => this.onChangeCellType(CellType.NUMBER, cells), icon: cell_type_icons[0]},
        { key: 'string', submenu: false,  simple: true, name: 'String', action: () => this.onChangeCellType(CellType.STRING, cells), icon: cell_type_icons[1]},
        { key: 'empty',  submenu: false,  simple: true, name: 'Empty',  action: () => this.onChangeCellType(CellType.EMPTY,  cells), icon: cell_type_icons[2]},
      ], expand_icon: <Play fill={true} /> },
      { key: 'text-color',        submenu: true, simple: false, component: (entry: AdvancedEntry, close: () => void, register_submenu: (submenu: { is_open: boolean, close: () => void }) => number, notify_open_submenu: (idx: number, is_open: boolean) => void) =>
          <ColorPickerMenuEntry text="Text color" key={entry.key} color={undefined} cb={color => this.onChangeCellTextColor(cells, color)} close={close} register_submenu={register_submenu} notify_open_submenu={notify_open_submenu} />
      },
      { key: 'background-color',  submenu: true, simple: false, component: (entry: AdvancedEntry, close: () => void, register_submenu: (submenu: { is_open: boolean, close: () => void }) => number, notify_open_submenu: (idx: number, is_open: boolean) => void) =>
          <ColorPickerMenuEntry text="Background color" key={entry.key} color={undefined} cb={color => this.onChangeCellBackgroundColor(cells, color)} close={close} register_submenu={register_submenu} notify_open_submenu={notify_open_submenu} />
      },
      { key: 'name',  submenu: false, simple: true, name: 'Set name', icon: <Type /> },
    ]

    this.openContextMenu(e.target as HTMLElement, menu)
  }

  private handleMouseSelection = (e: FakeMouseEvent, cell_id: CellId, whole_row_col: [boolean, boolean]) => {

    if(e.buttons === 2 || e.button === 2) return // block right-clicking

    this.setState({
      selection: handleMouseSelection(this.state.selection, this.state.dimensions, e, cell_id, whole_row_col)
    })
  }

  handleKeypress = (key: "ArrowLeft" | "ArrowUp" | "ArrowRight" | "ArrowDown", modifiers: Modifiers, preventDefault: () => void) => {

    const { selection, focused } = handleSelectionKeypress(key, {
      ...modifiers,
      mod: platform_detection.isMacOrIos() ? modifiers.meta : modifiers.ctrl // choose appropriate modifier for platform
    }, convert_to_selection_coordinates(this.state.selection), this.state.dimensions)

    preventDefault()

    this.setState({ selection, focused }, () => {
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

    // TODO: why is this.data[row][col] used and not just cell? Is cell just a copy?

    // used to compute which cells need to have their changes array updated
    const old_refs = cell.refs
    const old_cycle = [...cell.cycle]

    cell.err = undefined // resetting error; if it still exists it's going to get recomputed
    cell.cycle = []

    // if formula then assign new value to .vl and compute .fn
    if(value.startsWith('=')) {
      const {fn, refs: raw_refs} = parse_formula(value.substring(1))!
      cell.vl = value
      cell.fn = fn
      cell.refs = raw_refs.map(ref => typeof ref === 'string' ? lookup(ref, IDENTIFIER_CELLS) : ref) as CellId[]
    } else {
      if(cell.tp === CellType.NUMBER) {
        cell.fn = undefined
        cell.refs = []
        cell.err = undefined
        cell.changes = cell.changes.filter(cell_id => !compare_cell_ids(cell._id, cell_id)) // incase of self reference remove entry from changes array
        // don't reset cycle just yet, this would mean also recomputing the changes array for other cells; this is already done further down the chain
        const parsed_value = parseFloat(value)
        if(isNaN(parsed_value)) {
          console.log(cell)
          // TODO: what should happen here? this is what gets run if the value that is inputted is not a
          // TODO: number, but should the error be generated here or somewhere else; considering that no
          // TODO: other input is ever somehow flagged as invalid (you can perfectly well place strings
          // TODO: in a NUMBER cell using a reference) should this even be an error? I feel like there
          // TODO: should be stronger safe-guards against this and errors should be displayed using the
          // TODO: same mechanism rendered markdown is displayed. This means that everything tagged as a
          // TODO: number should display an error if the content of the cell is not interpretable as a number.
          cell.err = new Error("#NaN")
        } else {
          // nothing has changed (had to parse to a number first to check this)
          if(parsed_value === cell.vl) return
          cell.vl = parsed_value
        }
      } else if(cell.tp === CellType.STRING) {
        cell.vl = value
      }
    }

    console.log('value changed', cell)

    // when updating a cell the data structure becomes somewhat invalid:
    // each cell has a refs array and a changes array. The only thing that
    // can happen when editing a single cell is that the refs array of this cell
    // becomes out of date and thereby also the changes arrays of the cells that
    // are no longer part of the refs array and the ones newly added need to be
    // updated accordingly.
    // The fact that this only needs a little bit of updating is good as no complex
    // code has to be written. The most complex thing is probably finding out
    // which cells need to have their changes array updated.

    const new_refs = cell.refs
    const arr = compute_additions_and_deletions(new_refs, old_refs)

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

    check_circular_for_cell(this.data, cell)

    const new_cycle = cell.cycle

    if(new_cycle.length > 0 || old_cycle.length > 0) {
      // changes that need to be performed on all involved cells
      const arr = compute_additions_and_deletions(new_cycle, old_cycle).sort((a, b) => (+(b.from === 'old')) - (+(a.from === 'old')))

      // update all existing cycle arrays, even if the array is going to be removed later on
      old_cycle.forEach(([row, col]) => this.data[row][col].cycle = new_cycle)

      // remove cycle arrays from now unused cells and add to newly added cells
      arr.forEach(pair => {
        switch(pair.from) {
          case 'old': {
            this.data[pair.value[0]][pair.value[1]].cycle = []
          } break;
          case 'new': {
            this.data[pair.value[0]][pair.value[1]].cycle = new_cycle
          } break;
        }
      })
    }

    // a lot of stuff needs to be recalculated
    // loop through every cell mentioned in the changes array and recursively descend from there and update all of their values;
    // as elements "higher up" in the tree are being used by ones lower in the tree the higher up ones need to have been evaluated
    // before traversing further down.
    // Side Note: the changes array never changes by changing the formula EXCEPT when the formula was or is becoming a self
    // referencing formula; this might need to be handled specially
    // Side Note: it's not actually a tree as two leaves can both update the same cell, so it actually is only a directed graph
    // but some cells are visited multiple times by different leaves and could re-evaluated so they could be seen as multiple
    // nodes in a sense. With this bending of the definition it would be a tree again.
    // For programming purposes it can be thought of as a tree.
    const recurse = (cell: Cell, caller: string) => {
      const self = generate_id_format(cell._id)
      console.log(caller + ' -> ' + self, cell.vl)
      // console.assert(is_formula(cell), cell)

      try {
        cell.err = undefined // TODO: does this cause any unwanted side effects that im not aware of?
        cell._vl = cell.fn!((cell_id: string) => (this.g(cell_id, cell._id, false, this.data[row][col]._id)), lib)
        console.log(generate_id_format(cell._id) + ' updated to ' + cell._vl)
      } catch(err) {
        cell.err = err
      }

      const maybe_err = check_errors(cell)
      if(maybe_err !== undefined) cell.err = maybe_err
      
      cell.changes
        .filter(cell_id => !cell.cycle.find(cell_id_cycle => compare_cell_ids(cell_id, cell_id_cycle)))
        .map(([row, col]) => recurse(this.data[row][col], self))

    }

    this.data[row][col].changes
      .filter(cell_id => !this.data[row][col].cycle.find(cell_id_cycle => compare_cell_ids(cell_id, cell_id_cycle)))
      .map(([row, col]) => recurse(this.data[row][col], generate_id_format(cell._id)))

    this.update(cell._id)
  }

  render_cell(cell: Cell) {

    const v = this.g(cell.id, cell._id, true, cell._id) // TODO: this might need to change when `g` changes

    let content
    if(cell.err) {
      content = cell.err.message
    } else if(cell.cycle.length === 1 || cell.refs.find(cell_id => compare_cell_ids(cell._id, cell_id))) {
      content = '#Self reference'
    } else if(cell.cycle.length > 0) {
      content = '#Circular references'
    } else {
      content = format_data(v, cell.tp, cell.stp, cell.r_dec || this.props.options.rounding)
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
    return (
      <div style={{
        width:  ((this.state.dimensions.x * CELL_WIDTH)  + BORDER_CELL_WIDTH  + 1) + 'px',
        height: ((this.state.dimensions.y * CELL_HEIGHT) + BORDER_CELL_HEIGHT + 1) + 'px'
      }}>
        <table className="table">
          <tbody>
            <tr id={'r0l'} key={'r0l'}>
              <BorderCell key={'_._'} id={'_._'} className="" onMouseEvent={this.handleCellMouseEvents} content="/" />
              {range(this.columns).map(col_num =>
                  <BorderCell key={'_.' + col_num} id={'_.' + col_num} className="border-top" content={generate_col_id_format(col_num)} onMouseEvent={this.handleCellMouseEvents} />
              )}
            </tr>
            {range(this.rows).map(row_num =>
              <tr id={'r' + row_num} key={'r' + row_num}>
                <BorderCell key={row_num + '._'} id={row_num + '._'} className="border-left" content={String(row_num+1)} onMouseEvent={this.handleCellMouseEvents} />
                {range(this.columns).map(col_num => this.render_cell(this.data[row_num][col_num]))}
              </tr>
            )}
          </tbody>
        </table>
        <Selection
          start={{ x: this.state.selection.start_x, y: this.state.selection.start_y }}
          end=  {{ x: this.state.selection.end_x,   y: this.state.selection.end_y }}
          constants={{
            cell_width:       CELL_WIDTH,        cell_height:       CELL_HEIGHT,
            index_cell_width: BORDER_CELL_WIDTH, index_cell_height: BORDER_CELL_HEIGHT}}
        />
        {this.state.context_menu_ref
          ? <ContextMenu referenceElement={this.state.context_menu_ref} close={this.closeContextMenu} menu={this.state.context_menu_entries} placement="bottom" />
          : null
        }
      </div>
    )
  }
}
