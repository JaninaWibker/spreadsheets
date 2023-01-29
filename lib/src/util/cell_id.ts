import { alphabet } from './helpers'
import type { CellId } from '../types/Spreadsheet'

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

export default {
  generate_col_id_format,
  generate_id_format,
  parse_col_id_format,
  parse_cell_id_format,
}

export {
  generate_col_id_format,
  generate_id_format,
  parse_col_id_format,
  parse_cell_id_format,
}