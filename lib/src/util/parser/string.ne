# @lexer lexer
@preprocessor module

# sqstring -> %sqstring {% ([raw_str]) => raw_str.text %}
# dqstring -> %dqstring {% ([raw_str]) => raw_str.text %}

# dqstring -> %dq dstrchar:* %dq    {% ([, fst]) => fst.join("") %}
# sqstring -> %sq  sstrchar:* %sq   {% ([, fst]) => fst.join("") %}

# dstrchar -> %escaped_dq_or_nl     {% id %}
#           | %bs strescape         {% d => JSON.parse(`"${d.join('')}"`) %
#           | "\\\""                {% d => '"' %} # added by me

# sstrchar -> %escaped_sq_or_nl     {% id %}
#           | %bs strescape         {% d => JSON.parse(`"${d.join('')}"`) %}
#           | "\\'"                 {% d => "'" %}

# strescape -> %allowed_escapes     {% id %}
#            | %u %hex_digit %hex_digit %hex_digit %hex_digit     {% d => d.join("") %}



# JSON.parse('"' + raw_str.substring(1, raw_str.length-1).replace(/\\/, '\\\\') + '"')
# JSON.parse('"' + raw_str.substring(1, raw_str.length-1).replace(/\\/, '\\\\') + '"')

string -> dqstring {% id %}
        | sqstring {% id %}
        | btstring {% id %}

dqstring -> "\"" dstrchar:* "\""  {% ([, fst]) => fst.join("") %}
sqstring -> "'"  sstrchar:* "'"   {% ([, fst]) => fst.join("") %}
btstring -> "`"  [^`]:*    "`"    {% ([, fst]) => fst.join("") %}

dstrchar -> [^\\"\n]      {% id %}
    | "\\" strescape      {% d => JSON.parse('"'+d.join('')+'"') %}
    | "\\\""              {% () => '"' %}

sstrchar -> [^\\'\n]      {% id %}
    | "\\" strescape      {% d => JSON.parse('"'+d.join('')+'"') %}
    | "\\'"               {% () => "'" %}

strescape -> ["\\/bfnrt]  {% id %}
    | "u" [a-fA-F0-9] [a-fA-F0-9] [a-fA-F0-9] [a-fA-F0-9] {% d => d.join("") %}
