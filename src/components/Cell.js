import React from 'react'
import Editable from './Editable.js'
import styled from 'styled-components'

const BorderCell = styled.th`
  background-color: white;
  user-select: none;
  :hover {
    background-color: rgba(248,28,229,0.35);
  }
`
const Cell = ({id, content, className, editable=false, isBorder=false, cb, sel_cb, handleArrowKeys, raw_data, tp, isFocused=false}) => {
  return (
  isBorder
    ? (
      <BorderCell
        className={'border' + (className ? ' ' + className : '')}
        onMouseDown={e => console.log(e.target, id)}
        onMouseUp={e => console.log(e.target, id)} id={id}>
          <div>
            <span>{content}</span>
          </div>
      </BorderCell>
    ) : (
      <td id={id}>
        <div
          onMouseDown={e => sel_cb ? sel_cb(e, id) : null}
          onMouseUp={e => sel_cb ? sel_cb(e, id) : null}
          onMouseEnter={e => sel_cb ? sel_cb(e, id) : null}>
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
