import nearley from 'nearley'
import grammar from './excel.js'

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

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
        console.log(compile_inner(args[0]), compile_inner(args[1]), compile_inner(args[2]))
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
      return '<range>'
    }

    case 'parenthesis':           return `(${compile_inner(ast.val)})`

    case 'boolean':               return ast.val
    case 'number':                return ast.val
    case 'string':                return ast._val // this already includes the right quotes
    case 'identifier':            return ast.val
    default: {
      return `throw Error('Invalid type error')`
    }
  }
}

const parse = input => {
  parser.feed(input)

  return parser.results
}

export { parse, compile }