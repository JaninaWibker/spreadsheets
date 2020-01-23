// Generated automatically by nearley, version 2.19.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
 /* eslint-disable */ 

const lexer = require('./lexer');


var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "start", "symbols": ["l_or"], "postprocess": id},
    {"name": "primitive", "symbols": ["boolean"], "postprocess": ([fst]) => ({ type: 'boolean', val: fst })},
    {"name": "primitive", "symbols": ["number"], "postprocess": ([fst]) => ({ type: 'number', val: fst })},
    {"name": "primitive", "symbols": ["string"], "postprocess": ([fst]) => ({ type: 'string', sub_type: fst.type, val: fst.val, _val: fst._val })},
    {"name": "primitive", "symbols": ["cell"], "postprocess": id},
    {"name": "number", "symbols": [(lexer.has("digits") ? {type: "digits"} : digits)], "postprocess": ([fst]) => parseInt(fst, 10)},
    {"name": "number$ebnf$1$subexpression$1", "symbols": [(lexer.has("digits") ? {type: "digits"} : digits)]},
    {"name": "number$ebnf$1", "symbols": ["number$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "number$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "number", "symbols": [(lexer.has("digits") ? {type: "digits"} : digits), (lexer.has("dot") ? {type: "dot"} : dot), "number$ebnf$1"], "postprocess": ([fst, _, snd]) => parseFloat(fst + (snd ? '.' + snd : ''))},
    {"name": "_exp$ebnf$1", "symbols": [(lexer.has("plus_minus") ? {type: "plus_minus"} : plus_minus)], "postprocess": id},
    {"name": "_exp$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "_exp", "symbols": [(lexer.has("e") ? {type: "e"} : e), "_exp$ebnf$1", (lexer.has("digits") ? {type: "digits"} : digits)], "postprocess": ([_, fst, snd]) => (fst || '+') + snd},
    {"name": "boolean", "symbols": [(lexer.has("true") ? {type: "true"} : true)], "postprocess": () => true},
    {"name": "boolean", "symbols": [(lexer.has("false") ? {type: "false"} : false)], "postprocess": () => false},
    {"name": "cell", "symbols": ["column", "row"], "postprocess": ([fst, snd]) => ({ type: 'cell', val: [fst.val, snd.val]})},
    {"name": "column", "symbols": [(lexer.has("id") ? {type: "id"} : id)], "postprocess": ([fst]) => ({ type: 'column', val: fst.text })},
    {"name": "row", "symbols": [(lexer.has("digits") ? {type: "digits"} : digits)], "postprocess": ([fst]) => ({ type: 'row', val: parseInt(fst, 10) })},
    {"name": "string", "symbols": ["dqstring"], "postprocess": ([fst]) => ({ type: 'dqstring', val: fst/*, _val: `'${fst}'`*/ })},
    {"name": "string", "symbols": ["sqstring"], "postprocess": ([fst]) => ({ type: 'sqstring', val: fst/*, _val: `"${fst}"`*/ })},
    {"name": "sqstring", "symbols": [(lexer.has("sqstring") ? {type: "sqstring"} : sqstring)], "postprocess": ([raw_str]) => raw_str.text},
    {"name": "dqstring", "symbols": [(lexer.has("dqstring") ? {type: "dqstring"} : dqstring)], "postprocess": ([raw_str]) => raw_str.text},
    {"name": "list", "symbols": ["l_or"], "postprocess": id},
    {"name": "list$ebnf$1$subexpression$1", "symbols": [(lexer.has("comma_op") ? {type: "comma_op"} : comma_op), "l_or"]},
    {"name": "list$ebnf$1", "symbols": ["list$ebnf$1$subexpression$1"]},
    {"name": "list$ebnf$1$subexpression$2", "symbols": [(lexer.has("comma_op") ? {type: "comma_op"} : comma_op), "l_or"]},
    {"name": "list$ebnf$1", "symbols": ["list$ebnf$1", "list$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "list", "symbols": ["l_or", "list$ebnf$1"], "postprocess": ([fst, snd]) => ({ type: 'list',  val: [fst, ...snd.map(([_, item]) => item)] })},
    {"name": "l_or", "symbols": ["l_and"], "postprocess": id},
    {"name": "l_or", "symbols": ["l_or", (lexer.has("or_op") ? {type: "or_op"} : or_op), "l_and"], "postprocess": ([fst, _, snd]) => ({ type: 'or',  val: [fst, snd] })},
    {"name": "l_and", "symbols": ["cond_1"], "postprocess": id},
    {"name": "l_and", "symbols": ["l_and", (lexer.has("and_op") ? {type: "and_op"} : and_op), "cond_1"], "postprocess": ([fst, _, snd]) => ({ type: 'and', val: [fst, snd] })},
    {"name": "cond_1", "symbols": ["cond_2"], "postprocess": id},
    {"name": "cond_1", "symbols": ["cond_1", (lexer.has("neq_op") ? {type: "neq_op"} : neq_op), "cond_2"], "postprocess": ([fst, _, snd]) => ({ type: 'inequality',  val: [fst, snd] })},
    {"name": "cond_1", "symbols": ["cond_1", (lexer.has("eq_op") ? {type: "eq_op"} : eq_op), "cond_2"], "postprocess": ([fst, _, snd]) => ({ type: 'equality',    val: [fst, snd] })},
    {"name": "cond_2", "symbols": ["arith_1"], "postprocess": id},
    {"name": "cond_2", "symbols": ["cond_2", (lexer.has("gt_op") ? {type: "gt_op"} : gt_op), "arith_1"], "postprocess": ([fst, _, snd]) => ({ type: 'greater_than',          val: [fst, snd] })},
    {"name": "cond_2", "symbols": ["cond_2", (lexer.has("lt_op") ? {type: "lt_op"} : lt_op), "arith_1"], "postprocess": ([fst, _, snd]) => ({ type: 'less_than',             val: [fst, snd] })},
    {"name": "cond_2", "symbols": ["cond_2", (lexer.has("ge_op") ? {type: "ge_op"} : ge_op), "arith_1"], "postprocess": ([fst, _, snd]) => ({ type: 'greater_than_or_equal', val: [fst, snd] })},
    {"name": "cond_2", "symbols": ["cond_2", (lexer.has("le_op") ? {type: "le_op"} : le_op), "arith_1"], "postprocess": ([fst, _, snd]) => ({ type: 'less_than_or_equal',    val: [fst, snd] })},
    {"name": "arith_1", "symbols": ["arith_2"], "postprocess": id},
    {"name": "arith_1", "symbols": ["arith_1", (lexer.has("sub_op") ? {type: "sub_op"} : sub_op), "arith_2"], "postprocess": ([fst, _, snd]) => ({ type: 'subtraction', val: [fst, snd] })},
    {"name": "arith_1", "symbols": ["arith_1", (lexer.has("add_op") ? {type: "add_op"} : add_op), "arith_2"], "postprocess": ([fst, _, snd]) => ({ type: 'addition',    val: [fst, snd] })},
    {"name": "arith_2", "symbols": ["power"], "postprocess": id},
    {"name": "arith_2", "symbols": ["arith_2", (lexer.has("mul_op") ? {type: "mul_op"} : mul_op), "power"], "postprocess": ([fst, _, snd]) => ({ type: 'multiplication',  val: [fst, snd] })},
    {"name": "arith_2", "symbols": ["arith_2", (lexer.has("div_op") ? {type: "div_op"} : div_op), "power"], "postprocess": ([fst, _, snd]) => ({ type: 'division',        val: [fst, snd] })},
    {"name": "arith_2", "symbols": ["arith_2", (lexer.has("mod_op") ? {type: "mod_op"} : mod_op), "power"], "postprocess": ([fst, _, snd]) => ({ type: 'modulo',          val: [fst, snd] })},
    {"name": "power", "symbols": ["unary"], "postprocess": id},
    {"name": "power", "symbols": ["power", (lexer.has("pow_op") ? {type: "pow_op"} : pow_op), "unary"], "postprocess": ([fst, _, snd]) => ({ type: 'power', val: [fst, snd] })},
    {"name": "unary", "symbols": ["call"], "postprocess": id},
    {"name": "unary", "symbols": [(lexer.has("not_op") ? {type: "not_op"} : not_op), "call"], "postprocess": ([_, fst,]) => ({ type: 'unary_negation',  val: fst })},
    {"name": "unary", "symbols": [(lexer.has("add_op") ? {type: "add_op"} : add_op), "call"], "postprocess": ([_, fst,]) => ({ type: 'unary_plus',      val: fst })},
    {"name": "unary", "symbols": [(lexer.has("sub_op") ? {type: "sub_op"} : sub_op), "call"], "postprocess": ([_, fst,]) => ({ type: 'unary_minus',     val: fst })},
    {"name": "call", "symbols": ["range"], "postprocess": id},
    {"name": "call", "symbols": ["id", (lexer.has("lparen") ? {type: "lparen"} : lparen), "list", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([fst, _, snd, __]) => ({ type: 'call', fn: fst.val.toLowerCase(), val: snd })},
    {"name": "call", "symbols": ["id", (lexer.has("lparen") ? {type: "lparen"} : lparen), (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([fst]) => ({ type: 'call', fn: fst.val.toLowerCase(), val: [] })},
    {"name": "range", "symbols": ["parentheses"], "postprocess": id},
    {"name": "range", "symbols": ["cell", (lexer.has("range_op") ? {type: "range_op"} : range_op), "cell"], "postprocess": ([fst, _, snd]) => ({ type: 'range', val: [fst, snd] })},
    {"name": "range", "symbols": ["column", (lexer.has("range_op") ? {type: "range_op"} : range_op), "column"], "postprocess": ([fst, _, snd]) => ({ type: 'range', val: [fst, snd] })},
    {"name": "range", "symbols": ["row", (lexer.has("range_op") ? {type: "range_op"} : range_op), "row"], "postprocess": ([fst, _, snd]) => ({ type: 'range', val: [fst, snd] })},
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
