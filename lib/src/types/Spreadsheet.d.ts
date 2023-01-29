import type { CellType, CellSubType } from './CellTypes'
import type { LibType } from '../util/stdlib'

import type { CSSProperties } from 'react'

export type CellId = [number, number]

export type CellEvaluateFn = (g: (id: string) => number | string | undefined, lib: LibType) => number | string

export type UnfinishedCell = {
  tp: CellType,
  stp?: CellSubType,
  style?: object,
  vl: number | string,
  _vl?: number | string,
  err?: Error,
  name?: string
}

export type Cell = UnfinishedCell & {
  tp: CellType,
  stp?: CellSubType,
  id: string,
  _id: CellId,
  col: number,
  row: number,
  style?: CSSProperties,
  vl: number | string,
  _vl: number | string,
  err?: Error,
  cycle: CellId[],
  fn?: CellEvaluateFn,
  refs: CellId[],
  changes: CellId[],
  visited: boolean,
  name?: string,
  r_dec?: number // number of decimal places after the period
}

export type NumberCell = Cell & {
  tp: CellType.NUMBER,
  _vl: number,
  fn?: () => number
}

export type StringCell = Cell & {
  tp: CellType.STRING,
  _vl: string,
  fn?: () => string
}

export type EmptyCell = Cell & {
  tp: CellType.EMPTY
}

export type SpreadsheetOptions = {
  rounding: number
}

export type Spreadsheet = {
  options: SpreadsheetOptions,
  data: Cell[][],
  identifier_cells: { [key: string]: CellId } = {},
  name: string
}
