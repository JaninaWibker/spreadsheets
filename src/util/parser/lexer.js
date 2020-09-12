const moo = require('moo')

const lexer = moo.compile({

  // whitespace
  ws: /[ \t\v\f]/,
  
  // operators
  comma_op: ',',
  or_op: '||',
  and_op: '&&',
  eq_op: '==',
  neq_op: '!=',
  gt_op: '>',
  lt_op: '<',
  ge_op: '>=',
  le_op: '<=',
  add_op: '+',
  sub_op: '-',
  mul_op: '*',
  div_op: '/',
  mod_op: '%',
  pow_op: '^',
  not_op: '!',
  range_op: ':',
  lparen: '(',
  rparen: ')',

  // identifiers
  id: /[_a-zA-Z]+/,

  // primitives
  digits: /[0-9]+/,
  characters: /^(?!true$|false$)[a-zA-Z_]+$/,
  dot: '.',
  e: /[eE]/,
  plus_minus: /[+-]/,
  true: 'true',
  false: 'false',

  // strings
  sqstring: /'(?:[^\\'\n]|\\'|\\(?:["\\/bfnrt]|u[a-fA-F0-9]{4}))*'/,
  dqstring: /"(?:[^\\"\n]|\\"|\\(?:["\\/bfnrt]|u[a-fA-F0-9]{4}))*"/,
})

lexer.next = (next => () => {
  let tok;
  while ((tok = next.call(lexer)) && tok.type === 'ws') {}
  return tok;
})(lexer.next);

module.exports = lexer