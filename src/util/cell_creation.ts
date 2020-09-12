import { range } from './helpers'

import type { Cell, CellId, UnfinishedCell, EmptyCell, CellEvaluateFn } from '../types/Spreadsheet'
import { CellType, CellSubType } from '../types/CellTypes'

// create specific cells, cells in general, whole Table, create Rows and Columns, fill in missing Ids

const createCell = ([row, col]: CellId, tp: CellType=CellType.STRING, vl: number | string = '', stp?: CellSubType, fn?: CellEvaluateFn, style={}): Cell => ({
  tp, stp, id: row + '.' + col, _id: [row, col], row, col, style, vl, _vl: '', err: undefined, fn, refs: [], changes: [], visited: false
})

const createEmptyCell = (id: CellId) => createCell(id, CellType.EMPTY)
const createStringCell = (id: CellId, vl: string, fn?: CellEvaluateFn, stp?: CellSubType) => createCell(id, CellType.STRING, vl, stp, fn)
const createNumberCell = (id: CellId, vl: number, fn?: CellEvaluateFn, stp?: CellSubType) => createCell(id, CellType.NUMBER, vl, stp, fn)

const createRow = (start: number, end: number, col: number, cell: Cell) =>
  range(end-start)
    .map(y => y + start)
    .map(y => cell
      ? createCell([y, col], cell.tp, cell.vl, cell.stp, cell.fn)
      : createCell([y, col])
    )

const createCol = (start: number, end: number, row: number, cell: Cell) =>
  range(end-start)
    .map(x => x + start)
    .map(x => cell
      ? createCell([row, x], cell.tp, cell.vl, cell.stp, cell.fn)
      : createCell([row, x])
    )

const createTable = (start_x: number, start_y: number, end_x: number, end_y: number, cell: any): Cell[][] =>
  range(end_y - start_y)
    .map(x => x + start_y)
    .map(x => createRow(start_x, end_x, x, cell))

const fillTableEmpty = (height: number, width: number, array: Cell[][] | UnfinishedCell[][]): Cell[][] | UnfinishedCell[][] =>
  range(height).map(y => array[y]
    ? range(width).map(x =>
      array[y][x]
        ? array[y][x]
        : createEmptyCell([y, x])
      )
    : createRow(0, width, y, createEmptyCell([-1, -1])
  ))

const fillTableIds = (height: number, width: number, array: Cell[][] | UnfinishedCell[][]): Cell[][] =>
  range(height).map(y => array[y]
    ? range(width).map(x =>
      array[y][x]
        ? "id" in array[y][x]
          ? array[y][x] as Cell
          // @ts-ignore(2783): when considering the spread operator keys are overridden, BUT the order they appear in is not overridden. Since objects keep track of the order of keys this just makes it easier to look at as otherwise every second cell would have a different order 
          : {tp: CellType.EMPTY, stp: undefined, id: '' + y + '.' + x, _id: [y, x], col: x, row: y, style: {}, vl: '', _vl: '', err: undefined, fn: undefined, refs: [], changes: [], visited: false, ...array[y][x]}
        : createStringCell([y, x], '**WARNING**: MISSING CELL')
      )
    : createRow(0, width, y, createStringCell([-1, -1], '**WARNING**: MISSING CELL')
  ))


export default {
  createCell,
  createEmptyCell,
  createStringCell,
  createNumberCell,
  createRow,
  createCol,
  createTable,
  fillTableEmpty,
  fillTableIds,
}

export {
  createCell,
  createEmptyCell,
  createStringCell,
  createNumberCell,
  createRow,
  createCol,
  createTable,
  fillTableEmpty,
  fillTableIds,
}
