# Matches various kinds of string literals

@{% const lexer = require('./lexer'); %}
@lexer lexer

string -> dqstring {% id %}
        | sqstring {% id %}

sqstring -> %sqstring {% ([raw_str]) => (console.log(raw_str), JSON.parse('"' + raw_str.text.substring(1, raw_str.text.length-1) + '"')) %}
dqstring -> %dqstring {% ([raw_str]) => (console.log(raw_str), JSON.parse('"' + raw_str.text.substring(1, raw_str.text.length-1) + '"')) %}


# # Double-quoted string
# dqstring -> %dq dstrchar:* %dq  {% ([_, fst]) =>  fst.join('') %}
# sqstring -> %sq  sstrchar:* %sq   {% ([_, fst]) =>  fst.join('') %}
# # btstring -> "`"  [^`]:*    "`"    {% ([_, fst]) =>  fst.join('') %}

# dstrchar -> %not_bs_dq_or_nl {% id %}
#     | %bs strescape {% d => JSON.parse(`"${d.join('')}"`) %}

# sstrchar -> %not_bs_sq_or_nl {% id %}
#     | %bs strescape {% d => JSON.parse(`"${d.join('')}"`) %}
#     | %escaped_sq {% () => "'" %}

# strescape -> %allowed_escapes {% id %}
#     | %u %hex_digit %hex_digit %hex_digit %hex_digit {% d => d.join('') %}


# # Matches various kinds of string literals

# @{% const lexer = require('./lexer'); %}
# @lexer lexer

# string -> dqstring {% id %}
#         | sqstring {% id %}

# # Double-quoted string
# dqstring -> %dq dstrchar:* %dq      {% ([_, fst]) =>  fst.join('') %}
# sqstring -> %sq  sstrchar:* %sq     {% ([_, fst]) =>  fst.join('') %}
# # btstring -> "`"  [^`]:*    "`"    {% ([_, fst]) =>  fst.join('') %}

# dstrchar -> not_bs_dq_or_nl    {% id %}
#     | %bs strescape {% d => JSON.parse(`"${d.join('')}"`) %}

# sstrchar -> not_bs_sq_or_nl    {% id %}
#     | %bs strescape {% d => JSON.parse(`"${d.join('')}"`) %}
#     | %escaped_sq {% () => "'" %}

# strescape -> %allowed_escapes       {% id %}
#     | %u hex_digit hex_digit hex_digit hex_digit {% d => d.join('') %}

# hex_digit -> %hex_digits            {% id %}
#            | [a-fA-F0-9]            {% id %}

# u -> %u   {% id %}
#    | "u"  {% id %}

# not_bs_sq_or_nl -> %not_bs_sq_or_nl {% id %}
#                       | [^\\'\n]              {% id %}

# not_bs_dq_or_nl -> %not_bs_dq_or_nl {% id %}
#                       | [^\\'\n]              {% id %}

