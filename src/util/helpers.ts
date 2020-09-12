import { inlineLexer } from './inline-markdown.js'
import { transpile } from './parser/index'

import type { Cell, CellId, UnfinishedCell, EmptyCell, CellEvaluateFn } from '../types/Spreadsheet'
import { CellType, CellSubType } from '../types/CellTypes'

const MARKED_OPTIONS = {
  smartypants: true
}

const marked = (text: string) => inlineLexer(text, {}, MARKED_OPTIONS)

const parse_formula = (text: string) => transpile(text)

const round = (number: number, decimals: number) => Number(Math.round(Number(number + 'e' + decimals)) + 'e-' + decimals)

const range = (l: number) => [...Array(l)].map((x,i) => i)

const Alphabet = 'ABCDEFGHIJKLNMOPQRSTUVWXYZ'.split('')
const alphabet = 'abcdefghijklnmopqrstuvwxyz'.split('')

const is_formula = (cell: Cell) => cell.vl && typeof(cell.vl) === 'string' && cell.vl.startsWith('=')

const default_value = (tp: CellType): string | number => {
  switch(tp) {
    case CellType.EMPTY:  return ''
    case CellType.STRING: return ''
    case CellType.NUMBER: return 0
  }
}

// format function, cell stuff is given and formatted data is returned

const format_data = (data: number | string | undefined, tp: CellType, stp: CellSubType | undefined, r_dec: number) => {
  if(typeof tp === 'undefined') throw Error('no type defined')
  else if(typeof data === 'undefined') return default_value(tp) // throw Error('no data defined')
  if(tp === CellType.NUMBER) {
    // this is incase something formatted as a number is actually a string, this shouldn't break the application, just ignore the formatting
    if(typeof data !== "number" && isNaN(parseFloat(data))) return data
    if(stp === CellSubType.PERCENTAGE && r_dec) return round((data as number) * 100, r_dec) + '%'
    if(stp === CellSubType.PERCENTAGE) return ((data as number) * 100) + '%'
    if(r_dec) return round(data as number, r_dec)
    else return data
  } else if(tp === CellType.STRING) {
    if(stp === CellSubType.UPPERCASE) return marked((data as string).toUpperCase())
    if(stp === CellSubType.LOWERCASE) return marked((data as string).toLowerCase())
    else return marked(String(data))
  } else if(tp === CellType.EMPTY) {
    // TODO: this is just here for debugging
    return '<empty>'
  } else {
    return data
  }
}

// turn "122" into "DS" (zero-based)
const generate_col_id_format = (col_id: number) => {
  let col_name = ''
  let dividend = Math.floor(Math.abs(col_id + 1))
  let rest

  while(dividend > 0) {
    rest = (dividend - 1) % 26
    col_name = String.fromCharCode(65 + rest) + col_name
    dividend = Math.floor((dividend - rest)/26)
  }
  return col_name
}

const generate_id_format = ([row_id, col_id]: CellId) => {
  return generate_col_id_format(col_id) + (row_id+1)
}

// parse "ABC" into 1*26^2 + 2*26^1 * 
const parse_col_id_format = (row_id: string): number => {

  // acc: [count, significance]
  // significance of position, reducing by one each iteration
  // this is basically iteratively converting from base 26 to base 10

  const reducer = ([count, significance]: [number, number], curr: string): [number, number] =>
    [count + (alphabet.indexOf(curr) + 1) * Math.pow(alphabet.length, significance - 1), significance - 1]

  if(row_id === "") return -1

  return row_id
    .toLowerCase()
    .split("")
    .reduce(reducer, [0, row_id.length])[0] - 1
}

// parse cell ids to coordinates; can parse both "ABC123" and "123.123" but not named references ("=someNamedCell"); note that B1 has the column first and the row second while 0.1 has the row first followed by column
const parse_cell_id_format = (cell_id: String): [number, number] | null => {
  const excel_format = /^(?<col>[a-z]+)(?<row>[1-9]+[0-9]*)$/i
  const index_format = /^(?<row>[0-9]+).(?<col>[0-9]+)$/

  const excel_match = cell_id.match(excel_format)
  const index_match = cell_id.match(index_format)

  if(excel_match) {
    return [
      +excel_match.groups!.row - 1,
      parse_col_id_format(excel_match.groups!.col)
    ] // offsetting by one because zero-based
  } else if(index_match) {
    return [
      +index_match.groups!.row,
      +index_match.groups!.col
    ] // these should already be zero-based
  } else {
    return null
  }
}

// Viewport stuff (for scrolling when moving the selection)

const is_in_viewport = (element: HTMLElement, offset=40) => {
  let rect = element.getBoundingClientRect()
  return (
    rect.top >= (0 + offset) &&
    rect.left >= (0 + offset) &&
    rect.bottom <= ((window.innerHeight || document.documentElement.clientHeight) - offset) &&
    rect.right <= ((window.innerWidth || document.documentElement.clientWidth) - offset)
  )
}

const scroll_into_view_if_needed = (element: HTMLElement) =>
  !is_in_viewport(element)
    ? element.scrollIntoView({behavior: 'smooth', block: 'center'})
    : null

// Array contains keys, those keys are what is to be extracted from the object (including the values)

const destructure = (obj: { [key: string]: any }, template: { [key: string]: any } | string[]) => { // TODO: this SHOULD technically accept symbols but duo to an ongoing typescript bug symbols are not accepted as index-keys (https://github.com/microsoft/TypeScript/issues/1863)
  let _obj: { [key: string]: any } = {}
  if(Array.isArray(template)) {
    template.forEach((key: string) => _obj[key] = obj[key])
  } else {
    Object.keys(template).forEach(key => _obj[template[key]] = obj[key])
  }
  return _obj
}

// create specific cells, cells in general, whole Table, create Rows and Columns, fill in missing Ids

const createCell = ([row, col]: CellId, tp: CellType=CellType.STRING, vl: number | string = '', stp?: CellSubType, fn?: CellEvaluateFn, style={}): Cell => ({
  tp, stp, id: row + '.' + col, _id: [row, col], row, col, style, vl, _vl: '', err: undefined, fn, refs: [], changes: [], visited: false
})

const createEmptyCell = (id: CellId) => createCell(id, CellType.EMPTY)
const createStringCell = (id: CellId, vl: string, fn?: CellEvaluateFn, stp?: CellSubType) => createCell(id, CellType.STRING, vl, stp, fn)
const createNumberCell = (id: CellId, vl: number, fn?: CellEvaluateFn, stp?: CellSubType) => createCell(id, CellType.NUMBER, vl, stp, fn)

const createRow = (start: number, end: number, col: number, cell: Cell) =>
  range(end-start)
    .map(y => y + start)
    .map(y => cell
      ? createCell([y, col], cell.tp, cell.vl, cell.stp, cell.fn)
      : createCell([y, col])
    )

const createCol = (start: number, end: number, row: number, cell: Cell) =>
  range(end-start)
    .map(x => x + start)
    .map(x => cell
      ? createCell([row, x], cell.tp, cell.vl, cell.stp, cell.fn)
      : createCell([row, x])
    )

const createTable = (start_x: number, start_y: number, end_x: number, end_y: number, cell: any): Cell[][] =>
  range(end_y - start_y)
    .map(x => x + start_y)
    .map(x => createRow(start_x, end_x, x, cell))

const fillTableEmpty = (height: number, width: number, array: Cell[][] | UnfinishedCell[][]): Cell[][] | UnfinishedCell[][] =>
  range(height).map(y => array[y]
    ? range(width).map(x =>
      array[y][x]
        ? array[y][x]
        : createEmptyCell([y, x])
      )
    : createRow(0, width, y, createEmptyCell([-1, -1])
  ))

const fillTableIds = (height: number, width: number, array: Cell[][] | UnfinishedCell[][]): Cell[][] =>
  range(height).map(y => array[y]
    ? range(width).map(x =>
      array[y][x]
        ? "id" in array[y][x]
          ? array[y][x] as Cell
          // @ts-ignore(2783): when considering the spread operator keys are overridden, BUT the order they appear in is not overridden. Since objects keep track of the order of keys this just makes it easier to look at as otherwise every second cell would have a different order 
          : {tp: CellType.EMPTY, stp: undefined, id: '' + y + '.' + x, _id: [y, x], col: x, row: y, style: {}, vl: '', _vl: '', err: undefined, fn: undefined, refs: [], changes: [], visited: false, ...array[y][x]}
        : createStringCell([y, x], '**WARNING**: MISSING CELL')
      )
    : createRow(0, width, y, createStringCell([-1, -1], '**WARNING**: MISSING CELL')
  ))

export default {
  range,
  createCell,
  createEmptyCell,
  createStringCell,
  createNumberCell,
  createRow,
  createCol,
  createTable,
  fillTableEmpty,
  fillTableIds,
  round,
  destructure,
  default_value,
  is_in_viewport,
  scroll_into_view_if_needed,
  marked,
  is_formula,
  parse_formula,
  format_data,
  Alphabet,
  alphabet,
  generate_col_id_format,
  generate_id_format,
  parse_col_id_format,
  parse_cell_id_format,
}

export {
  range,
  createCell,
  createEmptyCell,
  createStringCell,
  createNumberCell,
  createRow,
  createCol,
  createTable,
  fillTableEmpty,
  fillTableIds,
  round,
  destructure,
  default_value,
  is_in_viewport,
  scroll_into_view_if_needed,
  marked,
  is_formula,
  parse_formula,
  format_data,
  Alphabet,
  alphabet,
  generate_col_id_format,
  generate_id_format,
  parse_col_id_format,
  parse_cell_id_format,
}
