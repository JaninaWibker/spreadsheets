import React from 'react'
import Editable from './Editable.js'
import '../css/cell.css'

const Cell = ({id, content, className, style, editable=false, isBorder=false, cb, sel_cb, handleArrowKeys, raw_data, tp, isFocused=false}) => {
  return (
  isBorder
    ? (
      <th
        className={'border-cell border' + (className ? ' ' + className : '')}
        onMouseDown={e => console.log(e.target, id)}
        onMouseUp={e => console.log(e.target, id)} id={id}>
          <div>
            <span>{content}</span>
          </div>
      </th>
    ) : (
      <td id={id}>
        <div
          onMouseDown={e => sel_cb ? sel_cb(e, id) : null}
          onMouseUp={e => sel_cb ? sel_cb(e, id) : null}
          onMouseEnter={e => sel_cb ? sel_cb(e, id) : null}
          style={style}>
            {!editable
              ? <span>{String(content)}</span>
              : <Editable
                  setInnerHTML={tp === 'STRING'}
                  handleArrowKeys={handleArrowKeys}
                  raw_data={String(raw_data)} cb={cb}
                  isFocused={isFocused}>
                    {String(content)}
                </Editable>
            }
        </div>
      </td>
    )
)}

export default Cell
