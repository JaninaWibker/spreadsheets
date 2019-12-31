import { Alphabet } from '../helpers.js'

import nearley from 'nearley'

import raw_excel_grammar from './excel.js'
import raw_string_grammar from './string.js'

const excel_grammar = nearley.Grammar.fromCompiled(raw_excel_grammar)
const string_grammar = nearley.Grammar.fromCompiled(raw_string_grammar)

const _compile_binary_operator = (op, [fst, snd]) => `${compile_inner(fst)} ${op} ${compile_inner(snd)}`

const _compile_unary_operator = (op, fst) => `${op}${compile_inner(fst)}`

const compile = ast => {
  // I know this is not considered good code, but using eval is pretty much the only choice here,
  // the other choice would be to completely interpret the ast everytime which is also not good
  // for performance reasons, better to just transpile to javascript once and be done with it.
  return window.eval(`(g, lib) => ${compile_inner(ast[0])}`)
}

const compile_inner = ast => {
  switch(ast.type) {
    case 'call': {
      const args = ast.val.type === 'list' ? ast.val.val : [ast.val]
      console.log(args)
      if(ast.fn === 'if' && args.length === 2) {
        return `((${compile_inner(args[0])}) ? ${compile_inner(args[1])} : undefined)`
      } else if(ast.fn === 'if' && args.length === 3) {
        return `((${compile_inner(args[0])}) ? ${compile_inner(args[1])} : ${compile_inner(args[2])})`
      } else if(ast.fn === 'if') {
        // TODO: somehow do error reporting, maybe by just throwing an error inside the later eval'ed code
        return `throw Error('Syntax error')`
      } else {
        return `lib.${ast.fn}(${args.map(compile_inner).join(', ')})`
      }
    }

    case 'or':                    return _compile_binary_operator('||',  ast.val)
    case 'and':                   return _compile_binary_operator('&&',  ast.val)
    case 'inequality':            return _compile_binary_operator('!=)', ast.val)
    case 'equality':              return _compile_binary_operator('===', ast.val)
    case 'greater_than':          return _compile_binary_operator('>',   ast.val)
    case 'less_than':             return _compile_binary_operator('<',   ast.val)
    case 'greater_than_or_equal': return _compile_binary_operator('>=',  ast.val)
    case 'less_than_or_equal':    return _compile_binary_operator('<=',  ast.val)
    case 'subtraction':           return _compile_binary_operator('-',   ast.val)
    case 'addition':              return _compile_binary_operator('+',   ast.val)
    case 'multiplication':        return _compile_binary_operator('*',   ast.val)
    case 'division':              return _compile_binary_operator('/',   ast.val)
    case 'modulo':                return _compile_binary_operator('%',   ast.val)
    case 'power':                 return `lib.pow(${ast.val[0], ast.val[1]})` // TODO: add lib.pow (Math.pow)

    case 'unary_negation':        return _compile_unary_operator('!', ast.val)
    case 'unary_plus':            return _compile_unary_operator('+', ast.val)
    case 'unary_minus':           return _compile_unary_operator('-', ast.val)

    case 'range': {
      console.log(ast)
      // maybe transpile this to an array?
      return '<range>'
    }

    case 'parenthesis':           return `(${compile_inner(ast.val)})`

    case 'boolean':               return ast.val
    case 'number':                return ast.val
    case 'string': {
      const str = parse_string(ast.val)[0]
      // what is returned is interpreted as javascript, meaning that it needs enclosing quotes
      // in order to pass as a valid string, this ensures that the right quotes are picked.
      if(ast.sub_type === 'dqstring') return `"${str}"`
      if(ast.sub_type === 'sqstring') return `'${str}'`
    }
    case 'identifier': {
      switch(ast.val.toLowerCase()) {
        case 'pi':  return `lib.pi`
        case 'e':   return `lib.e`
        default: return `g('${ast.val}')`
      }
    }
    case 'cell':                  return `g('${parseInt(ast.val[1], 10)-1}.${Alphabet.indexOf(ast.val[0].toUpperCase())}')` // TODO: this probably has the same problem as the code in Spreadsheet.js (g), what about 'AAA' instead of just a single 'A'?, probably have to split the characters and compute the index using that
    default: {
      console.log(ast)
      return `throw Error('Invalid type error')`
    }
  }
}

const parse = input => {
  const parser = new nearley.Parser(excel_grammar);
  parser.feed(input)
  return parser.finish()
}

const parse_string = str => {
  const string_parser = new nearley.Parser(string_grammar)
  string_parser.feed(str)
  return string_parser.finish()
}

const transpile = input => compile(parse(input))

window.transpile = transpile

export { parse, compile, transpile }