import { inlineLexer } from './inline-markdown.js'
import { transpile } from './parser/index'

import type { Cell, CellId } from '../types/Spreadsheet'
import { CellType, CellSubType } from '../types/CellTypes'
import { parse_cell_id_format } from './cell_id'

const Alphabet = 'ABCDEFGHIJKLNMOPQRSTUVWXYZ'.split('')
const alphabet = 'abcdefghijklnmopqrstuvwxyz'.split('')


const MARKED_OPTIONS = {
  smartypants: true
}

const marked = (text: string) => inlineLexer(text, {}, MARKED_OPTIONS)

const parse_formula = (text: string) => transpile(text)

const round = (number: number, decimals: number) => Number(Math.round(Number(number + 'e' + decimals)) + 'e-' + decimals)

const range = (l: number) => [...Array(l)].map((x,i) => i)

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
    return ''
  } else {
    return data
  }
}

const cell_to_json_replacer = (k: any, v: any) => {
  if(Array.isArray(v) && (k === '_id' || k === 'refs' || k === 'changes')) {
    return JSON.stringify(v)
  } else if(typeof(v) === 'function') {
    return v.toString()
  } else {
    return v
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


// this supports "ABC321", "123.123" as well as named references as cell formats
// returns null when cell not found
const lookup = (cell_id: string, identifier_cells: { [key: string]: CellId }): [number, number] | null => {
  
  // this supports both "ABC321", "123.123" as cell formats
  const pair = parse_cell_id_format(cell_id)

  // support for named references / identifiers
  if(!pair) {
    const identifierMatch = cell_id.match(/^[a-zA-Z_][a-zA-Z_0-9]*$/)
    if(identifierMatch && identifier_cells[identifierMatch[0]]) {
      return identifier_cells[identifierMatch[0]] // identifier (like variable names)
      // TODO: should this return Cell or CellId?
    } else {
      return null
    }
  } else {
    return pair
  }
}

const compare_cell_ids = ([row1, col1]: CellId, [row2, col2]: CellId) => row1 === row2 && col1 === col2

export default {
  range,
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
  lookup,
  compare_cell_ids,
  cell_to_json_replacer,
}

export {
  range,
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
  lookup,
  compare_cell_ids,
  cell_to_json_replacer,
}
