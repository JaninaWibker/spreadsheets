import { fillTableEmpty, fillTableIds } from './helpers.js'

const parse_options = (str) => str
    .split('\n')
    .filter(line => !!line)
    .map(line => line.split(':'))
    .reduce((acc, curr) => {
      acc[curr[0].trim()] = curr[1].trim()
      return acc
    }, {})

const transform_options = (raw_options) => {
  const rtn = {}

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
const transform_data = (raw_data) => {
  const rows = raw_data.length
  const columns = Math.max(...raw_data.map(line => line.length))

  return fillTableIds(rows, columns, fillTableEmpty(rows, columns, raw_data.map(line => line.map(cell => ({
    ...cell,
    tp: convert_type(cell.tp)
  })))))
}

const convert_type = (type) => {
  if(type === "S") return "STRING"
  if(type === "N") return "NUMBER"
  if(type === "E") return "EMPTY"
}

const parse_data = (str) => str
    .split("\n")
    .filter(line => !!line)
    .map(JSON.parse)

const parse_file = (str) => {

  const [ _sep1, config, _sep2, ...rest_arr ] = str.split(/(\s?---\s?)/g).filter(x => !!x)

  const rest = rest_arr.join("")

  return {
    options: transform_options(parse_options(config)),
    data: transform_data(parse_data(rest))
  }
}

export default parse_file