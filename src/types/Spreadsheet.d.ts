export enum CellType {
  NUMBER,
  STRING,
  EMPTY
}

export enum CellSubType {
  PERCENTAGE,
  UPPERCASE,
  LOWERCASE
}

export type CellId = [number, number]

export type Cell = {
  tp: CellType,
  stp: CellSubType,
  id: string,
  _id: CellId,
  col: number,
  row: number,
  style: object,
  vl: number | string,
  _vl: number | string,
  err: Error,
  fn?: () => number | string,
  refs: CellId[],
  changes: CellId[],
  visited: boolean
}


export type Spreadsheet = {
  options: {
    rounding: number
  },
  data: Cell[][],
  name: string
}