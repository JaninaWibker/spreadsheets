import React from 'react'
import Editable from './Editable'
import '../css/cell.css'

import { CellType } from '../types/CellTypes'

type BorderCellProps = {
  id: string, content: string, className: string
}

type CellProps = {
  id: string,
  content: number | string,
  style: object,
  editable: boolean,
  onValueChange: (value: string) => any,
  onMouseEvent: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, id: string) => any,
  onArrowKeyEvent: (key: "ArrowLeft" | "ArrowUp" | "ArrowRight" | "ArrowDown", shift: boolean, alt: boolean, ctrl: boolean, preventDefault: () => any) => any,
  raw_data: any,
  tp: CellType,
  isFocused: boolean
}

type GenericCellProps = CellProps & BorderCellProps & {
  isBorder: boolean
}

// TODO: make clicks on border cells select the whole row / column (maybe some special interaction with holding shift as well?)
const BorderCell = ({id, content, className}: BorderCellProps) => (
  <th
    className={'border-cell border' + (className ? ' ' + className : '')}
    onMouseDown={e => console.log(e.target, id)}
    onMouseUp={e => console.log(e.target, id)} id={id}>
      <div>
        <span>{content}</span>
      </div>
  </th>
)

const Cell = ({id, content, style, editable=false, onValueChange, onMouseEvent, onArrowKeyEvent, raw_data, tp, isFocused=false}: CellProps) => (
  <td id={id}>
    <div
      onMouseDown={e => onMouseEvent ? onMouseEvent(e, id) : null}
      onMouseUp={e => onMouseEvent ? onMouseEvent(e, id) : null}
      onMouseEnter={e => onMouseEvent ? onMouseEvent(e, id) : null}
      style={style}>
        {!editable
          ? <span>{String(content)}</span>
          : <Editable
              setInnerHTML={tp === CellType.STRING}
              onArrowKeyEvent={onArrowKeyEvent}
              raw_data={String(raw_data)}
              pretty_text={String(content)}
              cb={onValueChange}
              isFocused={isFocused} />
        }
    </div>
  </td>
)

const GenericCell = ({id, content, className, style, editable, isBorder=false, onValueChange, onMouseEvent, onArrowKeyEvent, raw_data, tp, isFocused}: GenericCellProps) =>
  isBorder
    ? (<BorderCell id={id} content={content} className={className} />)
    : (<Cell id={id} content={content} style={style} editable={editable} onValueChange={onValueChange} onMouseEvent={onMouseEvent} onArrowKeyEvent={onArrowKeyEvent} raw_data={raw_data} tp={tp} isFocused={isFocused} />)

export { BorderCell, Cell, GenericCell }
