// Generated automatically by nearley, version 2.19.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
 /* eslint-disable */ 
 const lexer = require('./lexer'); var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "start", "symbols": ["list"]},
    {"name": "primitive", "symbols": ["boolean"], "postprocess": ([fst]) => ({ type: 'boolean', val: fst })},
    {"name": "primitive", "symbols": ["number"], "postprocess": ([fst]) => ({ type: 'number', val: fst })},
    {"name": "number", "symbols": [(lexer.has("digits") ? {type: "digits"} : digits)], "postprocess": ([fst]) => parseInt(fst, 10)},
    {"name": "number$ebnf$1$subexpression$1", "symbols": [(lexer.has("digits") ? {type: "digits"} : digits)]},
    {"name": "number$ebnf$1", "symbols": ["number$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "number$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "number", "symbols": [(lexer.has("digits") ? {type: "digits"} : digits), (lexer.has("dot") ? {type: "dot"} : dot), "number$ebnf$1"], "postprocess": ([fst, _, snd]) => parseFloat(fst + (snd ? '.' + snd : ''))},
    {"name": "number$ebnf$2", "symbols": [(lexer.has("plus_minus") ? {type: "plus_minus"} : plus_minus)], "postprocess": id},
    {"name": "number$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "number", "symbols": [(lexer.has("digits") ? {type: "digits"} : digits), (lexer.has("e") ? {type: "e"} : e), "number$ebnf$2", (lexer.has("digits") ? {type: "digits"} : digits)], "postprocess": ([fst, _, snd, trd]) => (console.log(fst, _, snd, trd), parseFloat(fst + 'e' + (snd || '+') + trd))},
    {"name": "boolean", "symbols": [(lexer.has("true") ? {type: "true"} : true)], "postprocess": () => true},
    {"name": "boolean", "symbols": [(lexer.has("false") ? {type: "false"} : false)], "postprocess": () => false},
    {"name": "reference", "symbols": ["cell"], "postprocess": id},
    {"name": "reference", "symbols": ["column"], "postprocess": ([fst]) => ({ type: 'column',  val: fst })},
    {"name": "reference", "symbols": ["row"], "postprocess": ([fst]) => ({ type: 'row',     val: fst })},
    {"name": "cell", "symbols": ["column", "row"], "postprocess": ([fst, snd]) => ({ type: 'cell', val: [fst.val, snd.val]})},
    {"name": "column", "symbols": [(lexer.has("characters") ? {type: "characters"} : characters)], "postprocess": ([fst]) => ({ type: 'column', val: fst })},
    {"name": "row", "symbols": [(lexer.has("digits") ? {type: "digits"} : digits)], "postprocess": ([fst]) => ({ type: 'row', val: parseInt(fst, 10) })},
    {"name": "list", "symbols": ["unary"], "postprocess": id},
    {"name": "list", "symbols": ["unary", (lexer.has("comma_op") ? {type: "comma_op"} : comma_op), "list"], "postprocess": ([fst, _, snd]) => ({ type: 'list',  val: [fst, ...(snd.type === 'list' ? snd.val : [snd])] })},
    {"name": "unary", "symbols": ["call"], "postprocess": id},
    {"name": "unary", "symbols": [(lexer.has("not_op") ? {type: "not_op"} : not_op), "call"], "postprocess": ([_, fst,]) => ({ type: 'unary_negation',  val: fst })},
    {"name": "unary", "symbols": [(lexer.has("add_op") ? {type: "add_op"} : add_op), "call"], "postprocess": ([_, fst,]) => ({ type: 'unary_plus',      val: fst })},
    {"name": "unary", "symbols": [(lexer.has("sub_op") ? {type: "sub_op"} : sub_op), "call"], "postprocess": ([_, fst,]) => ({ type: 'unary_minus',     val: fst })},
    {"name": "call", "symbols": ["parentheses"], "postprocess": id},
    {"name": "call", "symbols": ["id", (lexer.has("lparen") ? {type: "lparen"} : lparen), "list", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([fst, _, snd, __]) => ({ type: 'call', fn: fst.val.toLowerCase(), val: snd })},
    {"name": "parentheses", "symbols": ["value"], "postprocess": id},
    {"name": "parentheses", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "list", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([_, fst, __]) => ({ type: 'parentheses', val: fst })},
    {"name": "value", "symbols": ["id"], "postprocess": id},
    {"name": "value", "symbols": ["primitive"], "postprocess": id},
    {"name": "id", "symbols": [(lexer.has("id") ? {type: "id"} : id)], "postprocess": ([fst]) => ({ type: 'identifier',  val: fst.text })}
]
  , ParserStart: "start"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
