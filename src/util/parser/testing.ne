@{% /* eslint-disable */ %}

@{% const lexer = require('./lexer'); %}
@lexer lexer

start -> list

# _  -> %ws:* {% () => null %}
# __ -> %ws:+ {% () => null %}

@include "./primitives.ne"

list -> unary                        {% id %}
      | unary %comma_op list         {% ([fst, _, snd]) => ({ type: 'list',  val: [fst, ...(snd.type === 'list' ? snd.val : [snd])] }) %}

unary -> call                       {% id %}
       | %not_op call               {% ([_, fst,]) => ({ type: 'unary_negation',  val: fst }) %}
       | %add_op call               {% ([_, fst,]) => ({ type: 'unary_plus',      val: fst }) %}
       | %sub_op call               {% ([_, fst,]) => ({ type: 'unary_minus',     val: fst }) %}
       
call -> parentheses                       {% id %}
      | id %lparen list %rparen     {% ([fst, _, snd, __]) => ({ type: 'call', fn: fst.val.toLowerCase(), val: snd }) %}
      # | id %lparen %rparen          {% ([fst]) => ({ type: 'call', fn: fst.val.toLowerCase(), val: [] }) %}

parentheses -> value                {% id %}
             | %lparen list %rparen {% ([_, fst, __]) => ({ type: 'parentheses', val: fst }) %}

value -> id                         {% id %}
       | primitive                  {% id %}

id -> %id                           {% ([fst]) => ({ type: 'identifier',  val: fst.text }) %} # disallow any kind of digit inside of identifiers, will maybe change to something like all sequences of digits must be preceded by "_" or something
