const UNVISITED = -1

type Edges = {
  [key: number]: number[]
}

const tarjans_algorithm = <Node>(nodes: Node[], edges: Edges): { lowlink: number[], id: number[], scc_count: number } => {
  const n = nodes.length
  let curr_id = 0
  let scc_count = 0
  const stack: number[] = []

  const id = Array.from({ length: n }).fill(UNVISITED) as number[]
  const lowlink = Array.from({ length: n }).fill(0) as number[]

  const on_stack = Array.from({ length: n }).fill(false) as boolean[]

  const dfs = (at: number) => {
    stack.push(at)
    on_stack[at] = true
    id[at] = curr_id
    lowlink[at] = curr_id
    curr_id++

    edges[at].forEach(to => {
      if (id[to] === UNVISITED) {
        dfs(to)
        lowlink[at] = Math.min(lowlink[at], lowlink[to])
      } else if (on_stack[to]) {
        lowlink[at] = Math.min(lowlink[at], id[to])
      }
    })

    if (lowlink[at] === id[at]) {
      let node: number
      do {
        node = stack.pop() as number
        on_stack[node] = false
        lowlink[node] = id[at]
      } while (node !== at)
      scc_count++
    }
  }

  for (let i = 0; i < n; i++) {
    if (id[i] === UNVISITED) dfs(i)
  }

  return { lowlink, id, scc_count }
}

const find_cycle_starting_from_node = (edges: Edges, node: number, prev = node, target = node, first_call = true): number[] => {
  if (node === target && !first_call) return [prev]
  const rest = edges[node].flatMap(to => to === node ? [to] : find_cycle_starting_from_node(edges, to, node, target, false))
  return first_call || rest.length === 0 ? rest : [prev, ...rest]
}

const cycle_count = <Node>(nodes: Node[], edges: Edges): number => tarjans_algorithm(nodes, edges).scc_count

const get_cycles = <Node>(nodes: Node[], edges: Edges): Node[][] => {
  const { lowlink, scc_count } = tarjans_algorithm(nodes, edges)

  const rtn: Node[][] = Array.from({ length: scc_count }).map(() => []) as Node[][] // cannot use .fill([]) here as all references are the same
  for (let i = 0, curr_scc_idx = -1, seen: { [key: number]: number } = {}; i < lowlink.length; i++) {
    if (seen[lowlink[i]] === undefined) {
      seen[lowlink[i]] = ++curr_scc_idx
    }
    rtn[seen[lowlink[i]]].push(nodes[i])
  }
  return rtn
}

export default {
  tarjans_algorithm,
  cycle_count,
  get_cycles,
  find_cycle_starting_from_node
}

export {
  tarjans_algorithm,
  cycle_count,
  get_cycles,
  find_cycle_starting_from_node
}
