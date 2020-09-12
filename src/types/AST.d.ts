export type ASTType = 'call'
| 'or'
| 'and'
| 'inequality'
| 'equality'
| 'greater_than'
| 'less_than'
| 'greater_than_or_equal'
| 'less_than_or_equal'
| 'subtraction'
| 'addition'
| 'multiplication'
| 'division'
| 'modulo'
| 'power'
| 'unary_negation'
| 'unary_plus'
| 'unary_minus'
| 'range'
| 'parenthesis'
| 'boolean'
| 'number'
| 'string'
| 'identifier'
| 'pi'
| 'e'
| 'cell'


export type AST = {
  type: any
  sub_type: any,
  val: any,
  fn?: string
}