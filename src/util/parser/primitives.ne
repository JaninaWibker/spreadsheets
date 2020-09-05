@lexer lexer

primitive -> boolean                {% ([fst]) => ({ type: 'boolean', val: fst }) %}
           | number                 {% ([fst]) => ({ type: 'number', val: fst }) %}
           | string                 {% ([fst]) => ({ type: 'string', sub_type: fst.type, val: fst.val, _val: fst._val }) %}
           | cell                   {% id %}

# primitives

# number (int, decimal, float; all without -/+ sign as this is handles prior)
number -> %digits                                           {% ([fst]) => parseInt(fst, 10) %}
        | %digits %dot (%digits):?                          {% ([fst, _, snd]) => parseFloat(fst + (snd ? '.' + snd : '')) %}
        # | %digits %dot %digits %e %plus_minus:? %digits     {% ([fst, _, snd, __, trd, fth]) => parseFloat(fst + '.' + snd + 'e' + (trd || '+') + fth) %}
        # | %digits %e %plus_minus:? %digits                  {% ([fst, _, snd, trd]) => parseFloat(fst + 'e' + (snd || '+') + trd) %}

_exp -> %e %plus_minus:? %digits                            {% ([_, fst, snd]) => (fst || '+') + snd %}

boolean -> %true                   {% () => true %}
         | %false                  {% () => false %}

cell -> column row                  {% ([fst, snd]) => ({ type: 'cell', val: [fst.val, snd.val]}) %}

column -> %id                       {% ([fst]) => ({ type: 'column', val: fst.text }) %}

row -> %digits                      {% ([fst]) => ({ type: 'row', val: parseInt(fst, 10) }) %}

string -> dqstring                  {% ([fst]) => ({ type: 'dqstring', val: fst/*, _val: `'${fst}'`*/ }) %}
        | sqstring                  {% ([fst]) => ({ type: 'sqstring', val: fst/*, _val: `"${fst}"`*/ }) %}

sqstring -> %sqstring {% ([raw_str]) => raw_str.text %}
dqstring -> %dqstring {% ([raw_str]) => raw_str.text %}
