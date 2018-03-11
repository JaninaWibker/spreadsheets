const range = (l) => [...Array(l)].map((x,i) => i)

const createCell = (id, tp='STRING', vl='', stp, fn) => ({ id, tp, stp, vl, fn })

const createEmptyCell = (id) => createCell(id, 'EMPTY')
const createStringCell = (id, vl, fn, stp) => createCell(id, 'STRING', vl, stp, fn)
const createNumberCell = (id, vl, fn, stp) => createCell(id, 'NUMBER', vl, stp, fn)

const createRow = (start, end, col, cell) =>
  range(end-start)
    .map(x => x + start)
    .map(x => cell
      ? createCell('' + col + '.' + x, cell.tp, cell.vl, cell.stp, cell.fn)
      : createCell('' + col + '.' + x)
    )

const createCol = (start, end, row, cell) =>
  range(end-start)
    .map(x => x + start)
    .map(x => cell
      ? createCell('' + x + '.' + row, cell.tp, cell.vl, cell.stp, cell.fn)
      : createCell('' + x + '.' + row))

const createTable = (start_x, start_y, end_x, end_y, cell) =>
  range(end_y - start_y)
    .map(x => x + start_y)
    .map(x => createRow(start_x, end_x, x, cell))

export default {
  range,
  createCell,
  createStringCell,
  createNumberCell,
  createRow,
  createCol,
  createTable
}

export {
  range,
  createCell,
  createEmptyCell,
  createStringCell,
  createNumberCell,
  createRow,
  createCol,
  createTable
}
