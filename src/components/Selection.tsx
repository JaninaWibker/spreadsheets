import React from 'react'

import { FakeMouseEvent, ModifiersPlatformAdjusted } from '../types/Events'
import { CellId } from '../types/Spreadsheet'

type SelectionCoordinates = {
  start: {x: number, y: number},
  end:   {x: number, y: number},
}

type SelectionCoordinatesAlternative = {
  start_x: number,
  start_y: number,
  end_x: number,
  end_y: number
}

type SelectionProps = SelectionCoordinates & {
  ref?: (instance: HTMLDivElement | null) => void,
  constants: {
    cell_width: number,
    cell_height: number,
    index_cell_width: number,
    index_cell_height: number
  }
}

type Arrowkeys = "ArrowLeft" | "ArrowUp" | "ArrowRight" | "ArrowDown"

const handleKeypress = (key: Arrowkeys, {shift, alt, mod}: ModifiersPlatformAdjusted, selection: SelectionCoordinates, dimensions: {x: number, y: number}) => {
  const sx: number = { ArrowLeft: -1, ArrowRight: 1, ArrowUp:  0, ArrowDown: 0 }[key] || 0
  const sy: number = { ArrowLeft:  0, ArrowRight: 0, ArrowUp: -1, ArrowDown: 1 }[key] || 0

  // TODO: set proper focus to the cell underneath the cursor; this allows pressing enter or similar to start editing

  // TODO: tab should select the next cell (shift tab inverse; ctrl either no difference or input completely ignored)

  // TODO: probably not the right place to add this but escape should deselect any selected cells and delete / bspace 
  // TODO: should delete contents of all selected cells (at ones; trigger update after all deletions are completed)

  const asx = sx * (mod ? dimensions.x : 1) // adjusted change in x direction
  const asy = sy * (mod ? dimensions.y : 1) // adjusted change in y direction

  return {
    selection: {
      start_x: Math.min(dimensions.x-1, Math.max(0, selection.start.x + ((shift && !alt) ? 0 : asx))),
      start_y: Math.min(dimensions.y-1, Math.max(0, selection.start.y + ((shift && !alt) ? 0 : asy))),
      end_x: Math.min(dimensions.x-1, Math.max(0, ((alt || shift) ? selection.end.x : selection.start.x) + asx)),
      end_y: Math.min(dimensions.y-1, Math.max(0, ((alt || shift) ? selection.end.y : selection.start.y) + asy)),
    }, focused: {
      x: selection.start.x,
      y: selection.start.y
    }
  }
}

const handleMouseSelection = (selection: SelectionCoordinatesAlternative, dimensions: { x: number, y: number }, e: FakeMouseEvent, [row, col]: CellId, [whole_row, whole_col]: [boolean, boolean]): SelectionCoordinatesAlternative => {
  
  if(e.type === 'mousedown') { // start dragging OR shift-clicking
    if(e.modifiers.shift) {
     return {
        start_x:  selection.start_x,
        start_y:  selection.start_y,
        end_x:    col,
        end_y:    row,
      }
    } else {
      return {
        start_x:  col,
        start_y:  row,
        end_x:    col,
        end_y:    row,
      }
    }
  } else if(e.type === 'mouseup') { // stop dragging
    return {
      start_x:  selection.start_x,
      start_y:  selection.start_y,
      end_x:    col,
      end_y:    row,
    }
  } else if(e.type === 'mouseenter' && e.buttons === 1) { // dragging (without explicitely starting or stopping)
    return {
      start_x:  selection.start_x,
      start_y:  selection.start_y,
      end_x:    col,
      end_y:    row,
    }
  } else if(e.type === 'click') { // clicking on border cell
    if(e.modifiers.shift) { // enlarge selection (using start of selection)
      return {
        start_x: whole_row ? 0 : selection.start_x,
        start_y: whole_col ? 0 : selection.start_y,
        end_x:   whole_row ? dimensions.x-1 : col,
        end_y:   whole_col ? dimensions.y-1 : row,
      }
    } else {
      console.log(`from ${whole_row ? 0 : col}.${whole_col ? 0 : row} to ${whole_row ? dimensions.x-1 : col}.${whole_col ? dimensions.y-1 : row}`)
      return {
        start_x:  whole_row ? 0 : col,
        start_y:  whole_col ? 0 : row,
        end_x:    whole_row ? dimensions.x-1 : col,
        end_y:    whole_col ? dimensions.y-1 : row,
      }
    }
  } else {
    return {
      start_x: selection.start_x,
      start_y: selection.start_y,
      end_x: selection.end_x,
      end_y: selection.end_y
    }
  }
}

const convert_to_selection_coordinates = ({ start_x, start_y, end_x, end_y}: { start_x: number, start_y: number, end_x: number, end_y: number }): SelectionCoordinates => ({
  start: { x: start_x, y: start_y },
  end:   { x: end_x  , y: end_y   }
})

const Selection = ({start, end, ref, constants: {cell_width, cell_height, index_cell_width, index_cell_height}}: SelectionProps) => (
  <div className="selection" ref={ref} style={{
    width:  ((Math.abs(start.x - end.x) * cell_width)  + cell_width)  +  'px',
    height: ((Math.abs(start.y - end.y) * cell_height) + cell_height) + 'px',
    left:   ((Math.min(start.x,  end.x) * cell_width)  + index_cell_width)  + 'px',
    top:    ((Math.min(start.y,  end.y) * cell_height) + index_cell_height) + 'px'
  }} />
)

export {
  Selection,
  handleKeypress,
  handleMouseSelection,
  convert_to_selection_coordinates
}

export default Selection