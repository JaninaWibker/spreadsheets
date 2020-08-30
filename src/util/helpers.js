import { inlineLexer } from '../util/inline-markdown.js'
import { transpile } from './parser/index.js'

const CELL_TYPE = {
  NUMBER: 'number',
  STRING: 'string',
  EMPTY: 'empty',
}

const CELL_SUBTYPE = {
  PERCENTAGE: 'percentage',
  UPPERCASE: 'uppercase',
  LOWERCASE: 'lowercase',
}

const MARKED_OPTIONS = {
  smartypants: true
}

const marked = text => inlineLexer(text, {}, MARKED_OPTIONS)

const parse_formula = text => transpile(text)

const round = (number, decimals) => Number(Math.round(number + 'e' + decimals) + 'e-' + decimals)

const range = (l) => [...Array(l)].map((x,i) => i)

const Alphabet = 'ABCDEFGHIJKLNMOPQRSTUVWXYZ'.split('')
const alphabet = 'abcdefghijklnmopqrstuvwxyz'.split('')

const default_value = tp => {
  if(tp === CELL_TYPE.EMPTY) return ''
  if(tp === CELL_TYPE.STRING) return ''
  if(tp === CELL_TYPE.NUMBER) return 0
}

// format function, cell stuff is given and formatted data is returned

const format_data = (data, tp, stp, r_dec) => {
  if(typeof tp === 'undefined') throw Error('no type defined')
  else if(typeof data === 'undefined') data = default_value(tp) // throw Error('no data defined')
  if(tp === CELL_TYPE.NUMBER) {
    // this is incase something formatted as a number is actually a string, this shouldn't break the application, just ignore the formatting
    if(typeof data !== "number" && isNaN(parseFloat(data))) return data
    if(stp === CELL_SUBTYPE.PERCENTAGE && r_dec) return round(data * 100, r_dec) + '%'
    if(stp === CELL_SUBTYPE.PERCENTAGE) return (data * 100) + '%'
    if(r_dec) return round(data, r_dec)
    else return data
  } else if(tp === CELL_TYPE.STRING) {
    if(stp === CELL_SUBTYPE.UPPERCASE) return marked(data.toUpperCase(), {}, {smartypants: true})
    if(stp === CELL_SUBTYPE.LOWERCASE) return marked(data.toLowerCase(), {}, {smartypants: true})
    else return marked(String(data), {}, {smartypants: true})
  } else if(tp === CELL_TYPE.EMPTY) {
    // TODO: this is just here for debugging
    return '<empty>'
  } else {
    return data
  }
}

// turn "122" into "DS" (zero-based)
const generate_col_id_format = (row_id) => {
  let col_name = ''
  let dividend = Math.floor(Math.abs(row_id + 1))
  let rest

  while(dividend > 0) {
    rest = (dividend - 1) % 26
    col_name = String.fromCharCode(65 + rest) + col_name
    dividend = parseInt((dividend - rest)/26)
  }
  return col_name
}

// parse "ABC" into 1*26^2 + 2*26^1 * 
const parse_col_id_format = (row_id) => {

  // acc: [count, significance]
  // significance of position, reducing by one each iteration
  // this is basically iteratively converting from base 26 to base 10

  const reducer = (acc, curr) =>
    [acc[0] + (alphabet.indexOf(curr) + 1) * Math.pow(alphabet.length, acc[1] - 1), acc[1] - 1]

  if(row_id === "") return -1

  return row_id
    .toLowerCase()
    .split("")
    .reduce(reducer, [0, row_id.length])[0] - 1
}

// parse cell ids to coordinates; can parse both "ABC123" and "123.123" but not named references ("=someNamedCell"); note that B1 has the column first and the row second while 0.1 has the row first followed by column
const parse_cell_id_format = (cell_id) => {
  const excel_format = /^(?<col>[a-z]+)(?<row>[1-9]+[0-9]*)$/i
  const index_format = /^(?<row>[0-9]+).(?<col>[0-9]+)$/

  const excel_match = cell_id.match(excel_format)
  const index_match = cell_id.match(index_format)

  if(excel_match) {
    return [
      excel_match.groups.row - 1,
      parse_col_id_format(excel_match.groups.col)
    ] // offsetting by one because zero-based
  } else if(index_match) {
    return [
      +index_match.groups.row,
      +index_match.groups.col
    ] // these should already be zero-based
  }
}

// Viewport stuff (for scrolling when moving the selection)

const is_in_viewport = (element, offset=40) => {
  let rect = element.getBoundingClientRect()
  return (
    rect.top >= (0 + offset) &&
    rect.left >= (0 + offset) &&
    rect.bottom <= ((window.innerHeigth || document.documentElement.clientHeight) - offset) &&
    rect.right <= ((window.innerWidth || document.documentElement.clientWidth) - offset)
  )
}

const scroll_into_view_if_needed = (element) =>
  !is_in_viewport(element)
    ? element.scrollIntoView({behavior: 'smooth', block: 'center'})
    : null

// Array contains keys, those keys are what is to be extracted from the object (including the values)

const destructure = (obj, template) => {
  let _obj = {}
  if(Array.isArray(template)) {
    template.forEach(key => _obj[key] = obj[key])
  } else {
    Object.keys(template).forEach(key => _obj[template[key]] = obj[key])
  }
  return _obj
}

// create specific cells, cells in general, whole Table, create Rows and Columns, fill in missing Ids

const createCell = ([row, col], tp=CELL_TYPE.STRING, vl=tp === CELL_TYPE.EMPTY ? undefined : '', stp, fn, style={}) => ({ tp, stp, id: row + '.' + col, _id: [row, col], row, col, style, vl, _vl: undefined, err: undefined, fn, refs: [], changes: [], visited: false })

const createEmptyCell = (id) => createCell(id, CELL_TYPE.EMPTY)
const createStringCell = (id, vl, fn, stp) => createCell(id, CELL_TYPE.STRING, vl, stp, fn)
const createNumberCell = (id, vl, fn, stp) => createCell(id, CELL_TYPE.NUMBER, vl, stp, fn)

const createRow = (start, end, col, cell) =>
  range(end-start)
    .map(y => y + start)
    .map(y => cell
      ? createCell([y, col], cell.tp, cell.vl, cell.stp, cell.fn)
      : createCell([y, col])
    )

const createCol = (start, end, row, cell) =>
  range(end-start)
    .map(x => x + start)
    .map(x => cell
      ? createCell([row, x], cell.tp, cell.vl, cell.stp, cell.fn)
      : createCell([row, x])
    )

const createTable = (start_x, start_y, end_x, end_y, cell) =>
  range(end_y - start_y)
    .map(x => x + start_y)
    .map(x => createRow(start_x, end_x, x, cell))

const fillTableEmpty = (height, width, array) =>
  range(height).map(y =>
    range(width).map(x =>
      array[y]
      ? array[y][x]
        ? array[y][x]
        : createEmptyCell([y, x])
      : createRow(0, width, y, createEmptyCell())
  ))

const fillTableIds = (height, width, array) =>
  range(height).map(y =>
    range(width).map(x =>
      array[y]
      ? array[y][x]
        ? array[y][x].id
          ? array[y][x]
          : {tp: undefined, stp: undefined, id: '' + y + '.' + x, _id: [y, x], col: x, row: y, style: {}, vl: undefined, _vl: undefined, err: undefined, fn: undefined, refs: [], changes: [], visited: false, refs: [], changes: [], _vl: undefined, ...array[y][x]}
        : createStringCell([y, x], '**WARNING**: MISSING CELL')
      : createRow(0, width, y, createStringCell(null, '**WARNING**: MISSING CELL'))
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
  format_data,
  Alphabet,
  alphabet,
  generate_col_id_format,
  parse_col_id_format,
  parse_cell_id_format,
  CELL_TYPE,
  CELL_SUBTYPE,
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
  parse_formula,
  format_data,
  Alphabet,
  alphabet,
  generate_col_id_format,
  parse_col_id_format,
  parse_cell_id_format,
  CELL_TYPE,
  CELL_SUBTYPE,
}
