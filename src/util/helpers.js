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

const fillTableEmpty = (height, width, array) =>
  range(height).map(x =>
    range(width).map(y =>
      array[x]
      ? array[x][y]
        ? array[x][y]
        : createEmptyCell('' + x + '.' + y)
      : createRow(0, width, x, createEmptyCell())
  ))

const fillTableIds = (height, width, array) =>
  range(height).map(x =>
    range(width).map(y =>
      array[x]
      ? array[x][y]
        ? array[x][y].id
          ? array[x][y]
          : {id: '' + x + '.' + y, ...array[x][y]}
        : createStringCell('' + x + '.' + y, '**WARNING**: MISSING CELL')
      : createRow(0, width, x, createStringCell(null, '**WARNING**: MISSING CELL'))
  ))

export default {
  range,
  createCell,
  createEmptyCell,
  createStringCell,
  createNumberCell,
  createRow,
  createCol,
  createTable,
  fillTableEmpty,
  fillTableIds
}

export {
  range,
  createCell,
  createEmptyCell,
  createStringCell,
  createNumberCell,
  createRow,
  createCol,
  createTable,
  fillTableEmpty,
  fillTableIds
}
