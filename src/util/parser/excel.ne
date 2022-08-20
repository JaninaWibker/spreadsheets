@{% /* eslint-disable */ %}
@preprocessor module

@{%
import lexer from './lexer'


%}
@lexer lexer

start -> l_or                       {% id %}

# _  -> %ws:* {% () => null %}
# __ -> %ws:+ {% () => null %}

@include "./primitives.ne"

list   -> l_or                      {% id %}
        | l_or (%comma_op l_or):+   {% ([fst, snd], loc) => ({ type: 'list',  val: [fst, ...snd.map(([_, item]) => item)], loc: loc }) %}

l_or -> l_and                       {% id %}
        | l_or %or_op l_and         {% ([fst, _, snd], loc) => ({ type: 'or',  val: [fst, snd], loc: loc }) %}

l_and -> cond_1                     {% id %}
       | l_and %and_op cond_1       {% ([fst, _, snd], loc) => ({ type: 'and', val: [fst, snd], loc: loc }) %}

# haven't really decided on what precedence I should choose, either:
# 1.: greater than (or equal) / less than (or equal) > equality / inequality
#     this would mean that `a == b > c` would be parsed the same as `a == (b > c)`

cond_1 -> cond_2                    {% id %}
        | cond_1 %neq_op cond_2     {% ([fst, _, snd], loc) => ({ type: 'inequality',  val: [fst, snd], loc: loc }) %}
        | cond_1 %eq_op  cond_2     {% ([fst, _, snd], loc) => ({ type: 'equality',    val: [fst, snd], loc: loc }) %}

cond_2 -> arith_1                   {% id %}
        | cond_2 %gt_op arith_1     {% ([fst, _, snd], loc) => ({ type: 'greater_than',          val: [fst, snd], loc: loc }) %}
        | cond_2 %lt_op arith_1     {% ([fst, _, snd], loc) => ({ type: 'less_than',             val: [fst, snd], loc: loc }) %}
        | cond_2 %ge_op arith_1     {% ([fst, _, snd], loc) => ({ type: 'greater_than_or_equal', val: [fst, snd], loc: loc }) %}
        | cond_2 %le_op arith_1     {% ([fst, _, snd], loc) => ({ type: 'less_than_or_equal',    val: [fst, snd], loc: loc }) %}

# or:
# 2.: equality / inequality > greater than (or equal) / less than (or equal)
#     this would mean that `a == b > c` would be parsed the same as: `(a == b) > c`

# cond_1 -> cond_2                    {% id %}
#         | cond_1 ">" cond_2         {% ([fst, _, snd], loc) => ({ type: 'greater_than',          val: [fst, snd], loc: loc }) %}
#         | cond_1 "<" cond_2         {% ([fst, _, snd], loc) => ({ type: 'less_than',             val: [fst, snd], loc: loc }) %}
#         | cond_1 ">=" cond_2        {% ([fst, _, snd], loc) => ({ type: 'greater_than_or_equal', val: [fst, snd], loc: loc }) %}
#         | cond_1 "<=" cond_2        {% ([fst, _, snd], loc) => ({ type: 'less_than_or_equal',    val: [fst, snd], loc: loc }) %}

# cond_2 -> arith_1                   {% id %}
#         | cond_2 "!=" arith_1       {% ([fst, _, snd], loc) => ({ type: 'inequality',  val: [fst, snd], loc: loc }) %}
#         | cond_2 "==" arith_1       {% ([fst, _, snd], loc) => ({ type: 'equality',    val: [fst, snd], loc: loc }) %}

arith_1 -> arith_2                  {% id %}
         | arith_1 %sub_op arith_2  {% ([fst, _, snd], loc) => ({ type: 'subtraction', val: [fst, snd], loc: loc }) %}
         | arith_1 %add_op arith_2  {% ([fst, _, snd], loc) => ({ type: 'addition',    val: [fst, snd], loc: loc }) %}

arith_2 -> power                    {% id %}
         | arith_2 %mul_op power    {% ([fst, _, snd], loc) => ({ type: 'multiplication',  val: [fst, snd], loc: loc }) %}
         | arith_2 %div_op power    {% ([fst, _, snd], loc) => ({ type: 'division',        val: [fst, snd], loc: loc }) %}
         | arith_2 %mod_op power    {% ([fst, _, snd], loc) => ({ type: 'modulo',          val: [fst, snd], loc: loc }) %}

power -> unary                      {% id %}
       | power %pow_op unary        {% ([fst, _, snd], loc) => ({ type: 'power', val: [fst, snd], loc: loc }) %}

unary -> call_or_lambda             {% id %}
       | %not_op call               {% ([_, fst,], loc) => ({ type: 'unary_negation',  val: fst, loc: loc }) %}
       | %add_op call               {% ([_, fst,], loc) => ({ type: 'unary_plus',      val: fst, loc: loc }) %} # not using %plus_op as it gets confused with %add_op since it is the same character
       | %sub_op call               {% ([_, fst,], loc) => ({ type: 'unary_minus',     val: fst, loc: loc }) %} # not using %minus_op as it gets confused with %sub_op since it is the same character

call_or_lambda -> call              {% id %}
                | %dot l_or         {% ([_, fst], loc) => ({ type: 'lambda', val: fst, loc: loc }) %}

call -> range                       {% id %}
      | id %lparen list %rparen     {% ([fst, _, snd, __], loc) => ({ type: 'call', fn: fst.val.toLowerCase(), val: snd, loc: loc }) %}
      | id %lparen %rparen          {% ([fst], loc)             => ({ type: 'call', fn: fst.val.toLowerCase(), val: { type: 'list', val: [] },  loc: loc }) %}

range -> parentheses                {% id %}
       | cell %range_op cell        {% ([fst, _, snd], loc) => ({ type: 'range', val: [fst, snd], loc: loc }) %}
       | column %range_op column    {% ([fst, _, snd], loc) => ({ type: 'range', val: [fst, snd], loc: loc }) %}
       | row %range_op row          {% ([fst, _, snd], loc) => ({ type: 'range', val: [fst, snd], loc: loc }) %}

parentheses -> value                {% id %}
             | %lparen list %rparen {% ([_, fst, __], loc) => ({ type: 'parentheses', val: fst, loc: loc }) %}

value -> id                         {% id %}
       | primitive                  {% id %}

id -> %id                           {% ([fst], loc) => ({ type: fst.text === 'it' ? 'it_identifier' : 'identifier',  val: fst.text, loc: loc }) %} # disallow any kind of digit inside of identifiers, will maybe change to something like all sequences of digits must be preceded by "_" or something
# id -> [_a-zA-Z] [_a-zA-Z]:*       {% ([fst, snd]) => ({ type: 'identifier',  val: fst + (snd ? snd.join('') : '') }) %} # disallow any kind of digit inside of identifiers, will maybe change to something like all sequences of digits must be preceded by "_" or something
