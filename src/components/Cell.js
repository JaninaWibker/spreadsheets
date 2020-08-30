import React from 'react'
import Editable from './Editable.js'
import '../css/cell.css'

import { CELL_TYPE } from '../util/helpers.js'

const BorderCell = ({id, content, className}) => (
  <th
    className={'border-cell border' + (className ? ' ' + className : '')}
    onMouseDown={e => console.log(e.target, id)}
    onMouseUp={e => console.log(e.target, id)} id={id}>
      <div>
        <span>{content}</span>
      </div>
  </th>
)

const Cell = ({id, content, style, editable=false, cb, sel_cb, handleArrowKeys, raw_data, tp, isFocused=false}) => (
  <td id={id}>
    <div
      onMouseDown={e => sel_cb ? sel_cb(e, id) : null}
      onMouseUp={e => sel_cb ? sel_cb(e, id) : null}
      onMouseEnter={e => sel_cb ? sel_cb(e, id) : null}
      style={style}>
        {!editable
          ? <span>{String(content)}</span>
          : <Editable
              setInnerHTML={tp === CELL_TYPE.STRING}
              handleArrowKeys={handleArrowKeys}
              raw_data={String(raw_data)} cb={cb}
              isFocused={isFocused}>
                {String(content)}
            </Editable>
        }
    </div>
  </td>
)

const GenericCell = ({id, content, className, style, editable, isBorder=false, cb, sel_cb, handleArrowKeys, raw_data, tp, isFocused}) =>
  isBorder
    ? (<BorderCell id={id} content={content} className={className} />)
    : (<Cell id={id} content={content} style={style} editable={editable} cb={cb} sel_cb={sel_cb} handleArrowKeys={handleArrowKeys} raw_data={raw_data} tp={tp} isFocused={isFocused} />)

export { BorderCell, Cell, GenericCell }
