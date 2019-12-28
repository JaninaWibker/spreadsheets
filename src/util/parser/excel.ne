@builtin "whitespace.ne"
@builtin "string.ne"

list   -> l_or                      {% id %}
        | l_or "," list             {% ([fst, _, snd]) => ({ type: 'list',  val: [fst, snd] }) %}

l_or -> l_and                       {% id %}
        | l_or "||" l_and           {% ([fst, _, snd]) => ({ type: 'or',  val: [fst, snd] }) %}

l_and -> cond_1                     {% id %}
       | l_and "&&" cond_1          {% ([fst, _, snd]) => ({ type: 'and', val: [fst, snd] }) %}

# haven't really decided on what precedence I should choose, either:
# 1.: greater than (or equal) / less than (or equal) > equality / inequality
#     this would mean that `a == b > c` would be parsed the same as `a == (b > c)`

cond_1 -> cond_2                    {% id %}
        | cond_1 "!=" cond_2        {% ([fst, _, snd]) => ({ type: 'inequality',  val: [fst, snd] }) %}
        | cond_1 "==" cond_2        {% ([fst, _, snd]) => ({ type: 'equality',    val: [fst, snd] }) %}

cond_2 -> arith_1                   {% id %}
        | cond_2 ">" arith_1        {% ([fst, _, snd]) => ({ type: 'greater_than',          val: [fst, snd] }) %}
        | cond_2 "<" arith_1        {% ([fst, _, snd]) => ({ type: 'less_than',             val: [fst, snd] }) %}
        | cond_2 ">=" arith_1       {% ([fst, _, snd]) => ({ type: 'greater_than_or_equal', val: [fst, snd] }) %}
        | cond_2 "<=" arith_1       {% ([fst, _, snd]) => ({ type: 'less_than_or_equal',    val: [fst, snd] }) %}

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
         | arith_1 "-" arith_2      {% ([fst, _, snd]) => ({ type: 'subtraction', val: [fst, snd] }) %}
         | arith_1 "+" arith_2      {% ([fst, _, snd]) => ({ type: 'addition',    val: [fst, snd] }) %}

arith_2 -> power                    {% id %}
         | arith_2 "*" power        {% ([fst, _, snd]) => ({ type: 'multiplication',  val: [fst, snd] }) %}
         | arith_2 "/" power        {% ([fst, _, snd]) => ({ type: 'division',        val: [fst, snd] }) %}
         | arith_2 "%" power        {% ([fst, _, snd]) => ({ type: 'modulo',          val: [fst, snd] }) %}

power -> unary                      {% id %}
       | power "^" unary            {% ([fst, _, snd]) => ({ type: 'power', val: [fst, snd] }) %}

unary -> call                       {% id %}
       | "!" call                   {% ([_, fst,]) => ({ type: 'unary_negation',  val: fst }) %}
       | "+" call                   {% ([_, fst,]) => ({ type: 'unary_plus',      val: fst }) %}
       | "-" call                   {% ([_, fst,]) => ({ type: 'unary_minus',     val: fst }) %}

call -> range                       {% id %}
      | id "(" list ")"             {% ([fst, _, snd, __]) => ({ type: 'call', fn: fst, val: snd }) %}

range -> parenthesis                {% id %}
       | cell ":" cell              {% ([fst, _, snd]) => ({ type: 'range', val: [fst, snd] }) %}
       | column ":" column          {% ([fst, _, snd]) => ({ type: 'range', val: [fst, snd] }) %}
       | row ":" row                {% ([fst, _, snd]) => ({ type: 'range', val: [fst, snd] }) %}

parenthesis -> value                {% id %}
             | "(" list ")"         {% ([_, fst, __]) => ({ type: 'parenthesis', val: fst }) %}

value -> _ id _                     {% ([_, fst, __]) => fst %}
       | _ primitive _              {% ([_, fst, __]) => fst %}

primitive -> boolean                {% ([fst]) => ({ type: 'boolean', val: fst.toLowerCase() === 'true' }) %}
           | number                 {% ([fst]) => ({ type: 'number', val: fst }) %}
           | string                 {% ([fst]) => ({ type: 'string', val: fst }) %}

id -> [_a-zA-Z] [_a-zA-Z\d]:*       {% ([fst, snd]) => ({ type: 'identifier',  val: fst + (snd ? snd.join('') : '') }) %}

# primitives

# number (int, decimal, float; all without -/+ sign as this is handles prior)
number -> [0-9]:+                                           {% ([fst]) => parseInt(fst.join(''), 10) %}
        | [0-9]:+ "." ([0-9]:+):?                           {% ([fst, _, snd]) => parseFloat(fst.join('') + (snd ? '.' + snd.join('') : '')) %}
        | [0-9]:+ "." [0-9]:+ [eE] [+-]:? [0-9]:+           {% ([fst, _, snd, __, trd, fth]) => parseFloat(fst.join('') + '.' + snd.join('') + 'e' + (trd || '+') + fth.join('')) %}
        | [0-9]:+ [eE] [+-]:? [0-9]:+                       {% ([fst, _, snd, trd]) => parseFloat(fst.join('') + 'e' + (snd || '+') + trd.join('')) %}
        # | [0-9]:+ ("." [0-9]:+):? ([eE] [+-]:? [0-9]:+):?   {% ([fst, snd, trd]) => parseFloat(fst.join('') + (snd ? '.' + snd[1].join('') : '') + (trd ? 'e' + (trd[1] || '+') + trd[2].join('') : '')) %}

string -> dqstring                  {% id %}
        | sqstring                  {% id %}

boolean -> "true"                   {% id %}
         | "false"                  {% id %}

cell -> column row                  {% id %}

column -> id                        {% id %}

row -> [0-9]:+                      {% id %}