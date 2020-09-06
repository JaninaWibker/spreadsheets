import React from 'react'

type SelectionProps = {
  start: {x: number, y: number},
  end: {x: number, y: number},
  ref?: (instance: HTMLDivElement | null) => void,
  constants: {
    cell_width: number,
    cell_height: number,
    index_cell_width: number,
    index_cell_height: number
  }
}

const Selection = ({start, end, ref, constants: {cell_width, cell_height, index_cell_width, index_cell_height}}: SelectionProps) => (
  <div className="selection" ref={ref} style={{
    width:  ((Math.abs(start.x - end.x) * cell_width)  + cell_width)  +  'px',
    height: ((Math.abs(start.y - end.y) * cell_height) + cell_height) + 'px',
    left:   ((Math.min(start.x,  end.x) * cell_width)  + index_cell_width)  + 'px',
    top:    ((Math.min(start.y,  end.y) * cell_height) + index_cell_height) + 'px'
  }} />
)

export default Selection