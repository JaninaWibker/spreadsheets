import nearley from 'nearley'
import grammar from './excel.js'

const parser = new nearley.Parser(nearley.Grammer.fromCompiled(grammar))

export default (input) => {
  parser.feed(input)

  return parser.results
}