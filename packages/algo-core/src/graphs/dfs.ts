import { annotate, callPop, callPush, highlight, visit } from "../trace/emit";
import type { Step } from "../trace/step";
import type { AlgorithmSpec } from "../types";
import { adjacency, defaultGraph, type GraphInput } from "./common";

const pseudocode = [
  "dfs(u):", // 1
  "  mark u visited", // 2
  "  for each neighbor w of u", // 3
  "    if w not visited: dfs(w)", // 4
  "  return (backtrack)", // 5
];

export function* dfs(input: GraphInput): Generator<Step> {
  const adj = adjacency(input);
  const visited = new Set<string>();

  function* go(u: string): Generator<Step> {
    yield callPush({ fn: "dfs", args: { u } }, 1);
    visited.add(u);
    yield highlight([u], 1, "active");
    yield visit(u, 2);
    for (const { to: w, id } of adj.get(u) ?? []) {
      yield highlight([id], 3, "active");
      if (!visited.has(w)) {
        yield* go(w);
        yield highlight([u], 4, "active"); // re-focus parent on the way back up
      } else {
        yield annotate(`${w} already visited — skip`, 4);
      }
    }
    yield callPop({ fn: "dfs", args: { u } }, 5);
  }

  yield* go(input.start);
}

export const dfsSpec: AlgorithmSpec<GraphInput> = {
  key: "dfs",
  title: "Depth-First Search",
  category: "graph",
  layout: "graph",
  pseudocode,
  complexity: { best: "O(V+E)", average: "O(V+E)", worst: "O(V+E)", space: "O(V)" },
  maxInputSize: 60,
  defaultInput: () => defaultGraph("A"),
  buildView: (input) => ({
    kind: "graph",
    directed: input.directed,
    nodes: input.nodes,
    edges: input.edges,
  }),
  run: dfs,
};
