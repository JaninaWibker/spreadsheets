@{% /* eslint-disable */ %}

@{%
const lexer = require('./lexer');


%}
@lexer lexer

start -> l_or                       {% id %}

# _  -> %ws:* {% () => null %}
# __ -> %ws:+ {% () => null %}

@include "./primitives.ne"

list   -> l_or                      {% id %}
        | l_or (%comma_op l_or):+   {% ([fst, snd]) => ({ type: 'list',  val: [fst, ...snd.map(([_, item]) => item)] }) %}
        # | l_or "," list           {% ([fst, _, snd]) => ({ type: 'list',  val: [fst, ...(snd.type === 'list' ? snd.val : [snd])] }) %}

l_or -> l_and                       {% id %}
        | l_or %or_op l_and         {% ([fst, _, snd]) => ({ type: 'or',  val: [fst, snd] }) %}

l_and -> cond_1                     {% id %}
       | l_and %and_op cond_1       {% ([fst, _, snd]) => ({ type: 'and', val: [fst, snd] }) %}

# haven't really decided on what precedence I should choose, either:
# 1.: greater than (or equal) / less than (or equal) > equality / inequality
#     this would mean that `a == b > c` would be parsed the same as `a == (b > c)`

cond_1 -> cond_2                    {% id %}
        | cond_1 %neq_op cond_2     {% ([fst, _, snd]) => ({ type: 'inequality',  val: [fst, snd] }) %}
        | cond_1 %eq_op  cond_2     {% ([fst, _, snd]) => ({ type: 'equality',    val: [fst, snd] }) %}

cond_2 -> arith_1                   {% id %}
        | cond_2 %gt_op arith_1     {% ([fst, _, snd]) => ({ type: 'greater_than',          val: [fst, snd] }) %}
        | cond_2 %lt_op arith_1     {% ([fst, _, snd]) => ({ type: 'less_than',             val: [fst, snd] }) %}
        | cond_2 %ge_op arith_1     {% ([fst, _, snd]) => ({ type: 'greater_than_or_equal', val: [fst, snd] }) %}
        | cond_2 %le_op arith_1     {% ([fst, _, snd]) => ({ type: 'less_than_or_equal',    val: [fst, snd] }) %}

# or:
# 2.: equality / inequality > greater than (or equal) / less than (or equal)
#     this would mean that `a == b > c` would be parsed the same as: `(a == b) > c`

# cond_1 -> cond_2                    {% id %}
#         | cond_1 ">" cond_2         {% ([fst, _, snd]) => ({ type: 'greater_than',          val: [fst, snd] }) %}
#         | cond_1 "<" cond_2         {% ([fst, _, snd]) => ({ type: 'less_than',             val: [fst, snd] }) %}
#         | cond_1 ">=" cond_2        {% ([fst, _, snd]) => ({ type: 'greater_than_or_equal', val: [fst, snd] }) %}
#         | cond_1 "<=" cond_2        {% ([fst, _, snd]) => ({ type: 'less_than_or_equal',    val: [fst, snd] }) %}

# cond_2 -> arith_1                   {% id %}
#         | cond_2 "!=" arith_1       {% ([fst, _, snd]) => ({ type: 'inequality',  val: [fst, snd] }) %}
#         | cond_2 "==" arith_1       {% ([fst, _, snd]) => ({ type: 'equality',    val: [fst, snd] }) %}

arith_1 -> arith_2                  {% id %}
         | arith_1 %sub_op arith_2  {% ([fst, _, snd]) => ({ type: 'subtraction', val: [fst, snd] }) %}
         | arith_1 %add_op arith_2  {% ([fst, _, snd]) => ({ type: 'addition',    val: [fst, snd] }) %}

arith_2 -> power                    {% id %}
         | arith_2 %mul_op power    {% ([fst, _, snd]) => ({ type: 'multiplication',  val: [fst, snd] }) %}
         | arith_2 %div_op power    {% ([fst, _, snd]) => ({ type: 'division',        val: [fst, snd] }) %}
         | arith_2 %mod_op power    {% ([fst, _, snd]) => ({ type: 'modulo',          val: [fst, snd] }) %}

power -> unary                      {% id %}
       | power %pow_op unary        {% ([fst, _, snd]) => ({ type: 'power', val: [fst, snd] }) %}

unary -> call_or_lambda             {% id %}
       | %not_op call               {% ([_, fst,]) => ({ type: 'unary_negation',  val: fst }) %}
       | %add_op call               {% ([_, fst,]) => ({ type: 'unary_plus',      val: fst }) %} # not using %plus_op as it gets confused with %add_op since it is the same character
       | %sub_op call               {% ([_, fst,]) => ({ type: 'unary_minus',     val: fst }) %} # not using %minus_op as it gets confused with %sub_op since it is the same character

call_or_lambda -> call              {% id %}
                | %dot l_or         {% ([_, fst]) => ({ type: 'lambda', val: fst }) %}

call -> range                       {% id %}
      | id %lparen list %rparen     {% ([fst, _, snd, __]) => ({ type: 'call', fn: fst.val.toLowerCase(), val: snd }) %}
      | id %lparen %rparen          {% ([fst]) => ({ type: 'call', fn: fst.val.toLowerCase(), val: [] }) %}

range -> parentheses                {% id %}
       | cell %range_op cell        {% ([fst, _, snd]) => ({ type: 'range', val: [fst, snd] }) %}
       | column %range_op column    {% ([fst, _, snd]) => ({ type: 'range', val: [fst, snd] }) %}
       | row %range_op row          {% ([fst, _, snd]) => ({ type: 'range', val: [fst, snd] }) %}

parentheses -> value                {% id %}
             | %lparen list %rparen {% ([_, fst, __]) => ({ type: 'parentheses', val: fst }) %}

value -> id                         {% id %}
       | primitive                  {% id %}

id -> %id                           {% ([fst]) => ({ type: fst.text === 'it' ? 'it_identifier' : 'identifier',  val: fst.text }) %} # disallow any kind of digit inside of identifiers, will maybe change to something like all sequences of digits must be preceded by "_" or something
# id -> [_a-zA-Z] [_a-zA-Z]:*       {% ([fst, snd]) => ({ type: 'identifier',  val: fst + (snd ? snd.join('') : '') }) %} # disallow any kind of digit inside of identifiers, will maybe change to something like all sequences of digits must be preceded by "_" or something
