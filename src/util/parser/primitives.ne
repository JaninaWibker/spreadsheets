# @builtin "string.ne"

@lexer lexer

primitive -> boolean                {% ([fst]) => ({ type: 'boolean', val: fst }) %}
           | number                 {% ([fst]) => ({ type: 'number', val: fst }) %}
          #  | string                 {% ([fst]) => ({ type: 'string', val: fst.val, _val: fst._val }) %}
          #  | reference              {% ([fst]) => ({ type: 'reference', val: fst %}

# primitives

# number (int, decimal, float; all without -/+ sign as this is handles prior)
number -> %digits                                           {% ([fst]) => parseInt(fst, 10) %}
        | %digits %dot (%digits):?                          {% ([fst, _, snd]) => parseFloat(fst + (snd ? '.' + snd : '')) %}
        # | %digits %dot %digits %e %plus_minus:? %digits     {% ([fst, _, snd, __, trd, fth]) => parseFloat(fst + '.' + snd + 'e' + (trd || '+') + fth) %}
        # | %digits %e %plus_minus:? %digits                  {% ([fst, _, snd, trd]) => (console.log(fst, _, snd, trd), parseFloat(fst + 'e' + (snd || '+') + trd)) %}
        # | [0-9]:+ ("." [0-9]:+):? ([eE] [+-]:? [0-9]:+):?   {% ([fst, snd, trd]) => parseFloat(fst.join('') + (snd ? '.' + snd[1].join('') : '') + (trd ? 'e' + (trd[1] || '+') + trd[2].join('') : '')) %}

# string -> dqstring                  {% ([fst]) => ({ type: 'dqstring', val: fst, _val: `'${fst}'` }) %}
#         | sqstring                  {% ([fst]) => ({ type: 'sqstring', val: fst, _val: `"${fst}"` }) %}

boolean -> %true                   {% () => true %}
         | %false                  {% () => false %}

reference -> cell                   {% id %}
           | column                 {% ([fst]) => ({ type: 'column',  val: fst }) %}
           | row                    {% ([fst]) => ({ type: 'row',     val: fst }) %}

cell -> column row                  {% ([fst, snd]) => ({ type: 'cell', val: [fst.val, snd.val]}) %}

column -> %characters               {% ([fst]) => ({ type: 'column', val: fst }) %}

row -> %digits                      {% ([fst]) => ({ type: 'row', val: parseInt(fst, 10) }) %}