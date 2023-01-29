// this will be the standard library for the formulas

// this allows using cb in multiple different ways:
// cb([args, args], args) stays as it is
// cb(args, args, args) turns into cb([args, args, args])
// this allows accepting both max(a, b, c) and max([a, b, c]) easily
const formatArguments = (cb: any, ...args: any) => Array.isArray(args[0])
  ? cb(args[0], args.splice(1))
  : cb(args)

const lib = {
  pi: Math.PI,
  e: Math.E,

  acos: Math.acos,
  acosh: Math.acosh,
  asin: Math.asin,
  atan: Math.atan,
  atanh: Math.atanh,
  atan2: Math.atan2,
  cos: Math.cos,
  cosh: Math.cosh,
  sin: Math.sin,
  sinh: Math.sinh,
  tan: Math.tan,
  tanh: Math.tanh,
  sqrt: Math.sqrt,

  abs: Math.abs,
  sign: Math.sign,
  round: Math.round,
  ceil: Math.ceil,
  floor: Math.floor,

  pow: Math.pow, // there is an operator for this ("^")

  exp: Math.exp,

  ln: Math.log,
  log2: Math.log2,
  log10: Math.log10,
  log: (base: number, value: number) => Math.log(value) / Math.log(base),

  max: (...args: any[]) => formatArguments((arr: number[]) => Math.max(...arr), ...args),
  min: (...args: any[]) => formatArguments((arr: number[]) => Math.min(...arr), ...args),
  sum: (...args: any[]) => formatArguments((arr: number[]) => {
    let sum = 0
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i]
    }
    return sum
  }, ...args),
  sumif: (arr: (number | string)[], pred: ((it: number | string) => boolean) = () => true) => {
    let sum = 0
    for (let i = 0; i < arr.length; i++) {
      if (typeof arr[i] === 'number' && pred(arr[i])) { // TODO: why doesn't this properly narrow the type to number?
        sum += arr[i] as number
      }
    }
    return sum
  },
  count: (...args: any[]) => formatArguments((arr: (number | string)[]) => arr.length, ...args),
  countif: (arr: (number | string)[], pred: ((it: number | string) => boolean) = () => true) => {
    console.log(arr, pred)
    let count = 0
    for (let i = 0; i < arr.length; i++) {
      if (pred(arr[i])) {
        count += 1
      }
    }
    return count
  },
  avg: (...args: any[]) => formatArguments((arr: number[]) => lib.sum(arr) / arr.length, ...args),
  concat: (...args: any[]) => formatArguments((arr: (string | number)[], delim = '') => {
    return arr.join(delim)
  }, ...args),
  concatenate: (...args: any) => lib.concat(...args),
  proper: (text: string): string => text
    .toLowerCase()
    .split(/([\s \-_.0-9])/)
    .map(fragment => fragment ? fragment[0].toUpperCase() + fragment.substring(1) : '')
    .join(''),
  rept: (text: string | number, times = 1): string => String(text).repeat(times),
  trim: (text: string): string => text.trim(),
  type: (value: number | string | undefined | (number | string)[]): number => { // TODO: could this somehow get information about the cell in order to also detect if a cell has an error, ...
    switch (typeof value) {
      case 'number': return 1
      case 'string': return 2
      // TODO: excel has boolean value as well
      // TODO: excel has error value as well
      case 'object': return 64 // typeof [] === 'object' so this super primitively checks for arrays

      default: return 0 // TODO: could this be treated as an empty string maybe?
    }
  },
  now: () => new Date(),
}

export type LibType = typeof lib

export { lib }

// left, right, now, choose, randbetween, convert, time stuff
