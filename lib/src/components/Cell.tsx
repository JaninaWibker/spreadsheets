import React from 'react'
import Editable from './Editable'
import '../css/cell.css'

import { CellType } from '../types/CellTypes'

import type { Modifiers } from '../types/Events'

type BorderCellProps = {
  id: string,
  content: string,
  className: string,
  onMouseEvent: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, id: string) => any
}

type CellProps = {
  id: string,
  content: number | string,
  style: object,
  editable: boolean,
  onValueChange: (value: string) => any,
  onMouseEvent: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, id: string) => any,
  onArrowKeyEvent: (key: 'ArrowLeft' | 'ArrowUp' | 'ArrowRight' | 'ArrowDown', modifiers: Modifiers, preventDefault: () => any) => any,
  raw_data: any,
  tp: CellType,
  isFocused: boolean
}

type GenericCellProps = CellProps & BorderCellProps & {
  isBorder: boolean
}

const BorderCell = ({ id, content, className, onMouseEvent }: BorderCellProps) => (
  <th
    className={'border-cell border' + (className ? ' ' + className : '')}
    onClick={e => onMouseEvent ? onMouseEvent(e, id) : null}
    onContextMenu={e => onMouseEvent ? onMouseEvent(e, id) : null}
    id={id}>
      <div className="cell">
        <span>{content}</span>
      </div>
  </th>
)

const Cell = ({ id, content, style, editable = false, onValueChange, onMouseEvent, onArrowKeyEvent, raw_data, tp, isFocused = false }: CellProps) => (
  <td id={id} className="cell-outer">
    <div
      onMouseDown={e => onMouseEvent ? onMouseEvent(e, id) : null}
      onMouseUp={e => onMouseEvent ? onMouseEvent(e, id) : null}
      onMouseEnter={e => onMouseEvent ? onMouseEvent(e, id) : null}
      onContextMenu={e => onMouseEvent ? onMouseEvent(e, id) : null}
      className="cell"
      style={style}>
        {!editable
          ? <span>{String(content)}</span>
          : (
              <Editable
                setInnerHTML={tp === CellType.STRING}
                onArrowKeyEvent={onArrowKeyEvent}
                raw_data={String(raw_data)}
                pretty_text={String(content)}
                cb={onValueChange}
                isFocused={isFocused} />
            )
        }
    </div>
  </td>
)

const GenericCell = ({ id, content, className, style, editable, isBorder = false, onValueChange, onMouseEvent, onArrowKeyEvent, raw_data, tp, isFocused }: GenericCellProps) =>
  isBorder
    ? (<BorderCell id={id} content={content} className={className} onMouseEvent={onMouseEvent} />)
    : (<Cell id={id} content={content} style={style} editable={editable} onValueChange={onValueChange} onMouseEvent={onMouseEvent} onArrowKeyEvent={onArrowKeyEvent} raw_data={raw_data} tp={tp} isFocused={isFocused} />)

export { BorderCell, Cell, GenericCell }
