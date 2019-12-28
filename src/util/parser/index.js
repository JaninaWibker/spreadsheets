import nearley from 'nearley'
import grammar from './excel.js'

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

const parse = input => {
  parser.feed(input)

  return parser.results
}

export { parse }