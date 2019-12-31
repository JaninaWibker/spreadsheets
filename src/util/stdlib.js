// this will be the standard library for the formulas

const format_arguments = (cb, ...args) => Array.isArray(args[0]) 
  ? cb(args[0])
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
  log: (base, value) => Math.log(value) / Math.log(base),


  max: format_arguments.bind(this, arr => Math.max(...arr)),
  min: format_arguments.bind(this, arr => Math.min(...arr)),
  sum: format_arguments.bind(this, arr => {
    let sum = 0;
    for(let i = 0; i < arr.length; i++)
      sum += arr[i]
    return sum
  }),
  sumif: format_arguments.bind(this, arr => {
    let sum = 0
    for(let i = 0; i < arr.length; i++)
      if(true) // somehow add the conditions here
        sum += arr[i]
    return sum
  }),
  count: format_arguments.bind(this, arr => arr.length),
  countif: format_arguments.bind(this, arr => {
    let count = 0
    for(let i = 0; i < arr.length; i++)
      if(true) // somehow add the conditions here
        count += 1
    return count
  }),
  avg: format_arguments.bind(this, arr => lib.sum(arr) / arr.length),
}

export default lib


// left, right, concatenation, proper, now, trim, rept, type, choose, randbetween, convert, time stuff