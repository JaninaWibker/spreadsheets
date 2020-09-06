import { fillTableEmpty, fillTableIds } from './helpers'
import { CellType } from '../types/CellTypes'
import { Spreadsheet, SpreadsheetOptions, Cell } from '../types/Spreadsheet'

type rawOptions = {
  'number.rounding': string,
  'date.format': string
}

type rawData = {
  tp: "S" | "N" | "E",
  vl: string | number,
  style?: object,
  name?: string
}

const parse_options = (str: string): rawOptions => <rawOptions> (str
    .split('\n')
    .filter((line: string) => !!line)
    .map((line: string) => line.split(':'))
    .reduce((acc: any, curr: string[]) => {
      acc[curr[0].trim()] = curr[1].trim()
      return acc
    }, {}))

const transform_options = (raw_options: rawOptions): SpreadsheetOptions => {
  const rtn: {rounding: number, date_format: string} = {
    rounding: 4,
    date_format: 'DD/MM/YYYY'
  }

  if(raw_options['number.rounding'] !== undefined) {
    rtn.rounding = +raw_options['number.rounding']
  }

  if(raw_options['date.format'] !== undefined) {
    rtn.date_format = raw_options['date.format']
  }

  // TODO: add more things here

  return rtn
}

// TODO: this should give all the cells ids and be able to handle skipping a few lines / cells
const transform_data = (raw_data: rawData[][]): Cell[][] => {
  const rows = raw_data.length
  const columns = Math.max(...raw_data.map((line) => line.length))

  const idk = raw_data.map(line => line.map(cell => ({ // TODO: idk
    ...cell,
    tp: convert_type(cell.tp)
  })))

  return fillTableIds(rows, columns, fillTableEmpty(rows, columns, raw_data.map(line => line.map(cell => ({
    ...cell,
    tp: convert_type(cell.tp)
  })))))
}

const convert_type = (type: "S" | "N" | "E"): CellType => {
  switch(type) {
    case "S": return CellType.STRING
    case "N": return CellType.NUMBER
    case "E": return CellType.EMPTY
  }
}

const parse_data = (str: string): rawData[][] => str
    .split("\n")
    .filter((line: string) => !!line)
    .map((line: string) => JSON.parse(line)) as rawData[][]

const parse_file = (str: string, name?: string): Spreadsheet => {

  const [ , config, , ...rest_arr ] = str.split(/(\s?---\s?)/g).filter(x => !!x)

  const rest = rest_arr.join("")

  return {
    options: transform_options(parse_options(config)),
    data: transform_data(parse_data(rest)),
    name: name || 'spreadsheet-' + Math.floor(Math.random()*Math.pow(36, 4)).toString(36)
  }
}

export default parse_file