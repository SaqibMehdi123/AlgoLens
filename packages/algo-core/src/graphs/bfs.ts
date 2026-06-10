import { annotate, dequeue, enqueue, highlight, visit, vars } from "../trace/emit";
import type { Step } from "../trace/step";
import type { AlgorithmSpec } from "../types";
import { adjacency, defaultGraph, type GraphInput } from "./common";

const pseudocode = [
  "enqueue(start); mark discovered", // 1
  "while queue not empty", // 2
  "  u ← dequeue()", // 3
  "  for each neighbor w of u", // 4
  "    if w not discovered", // 5
  "      mark discovered; enqueue(w)", // 6
  "  mark u visited", // 7
];

export function* bfs(input: GraphInput): Generator<Step> {
  const adj = adjacency(input);
  const discovered = new Set<string>([input.start]);
  const queue: string[] = [input.start];
  yield enqueue(input.start, 1);
  while (queue.length > 0) {
    const u = queue.shift()!;
    yield dequeue(u, 3);
    yield highlight([u], 3, "active");
    for (const { to: w, id } of adj.get(u) ?? []) {
      yield highlight([id], 4, "active");
      if (!discovered.has(w)) {
        discovered.add(w);
        queue.push(w);
        yield enqueue(w, 6);
      } else {
        yield annotate(`${w} already discovered — skip`, 5);
      }
    }
    yield visit(u, 7);
  }
  yield vars({ order: "BFS complete" }, 2);
}

export const bfsSpec: AlgorithmSpec<GraphInput> = {
  key: "bfs",
  title: "Breadth-First Search",
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
  run: bfs,
};
