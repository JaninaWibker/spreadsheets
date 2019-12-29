// Generated automatically by nearley, version 2.19.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
 const lexer = require('./lexer'); var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "string", "symbols": ["dqstring"], "postprocess": id},
    {"name": "string", "symbols": ["sqstring"], "postprocess": id},
    {"name": "sqstring", "symbols": [(lexer.has("sqstring") ? {type: "sqstring"} : sqstring)], "postprocess": ([raw_str]) => (console.log(raw_str), JSON.parse('"' + raw_str.text.substring(1, raw_str.text.length-1) + '"'))},
    {"name": "dqstring", "symbols": [(lexer.has("dqstring") ? {type: "dqstring"} : dqstring)], "postprocess": ([raw_str]) => (console.log(raw_str), JSON.parse('"' + raw_str.text.substring(1, raw_str.text.length-1) + '"'))}
]
  , ParserStart: "string"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
