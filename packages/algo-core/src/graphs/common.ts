import type { GraphEdgeInit, GraphNodeInit } from "../trace/step";

export interface GraphInput {
  nodes: GraphNodeInit[];
  edges: GraphEdgeInit[];
  start: string;
  directed: boolean;
}

/** Adjacency list keyed by node id; each entry remembers the edge id for highlighting. */
export function adjacency(input: GraphInput): Map<string, { to: string; id: string }[]> {
  const adj = new Map<string, { to: string; id: string }[]>();
  for (const n of input.nodes) adj.set(n.id, []);
  for (const e of input.edges) {
    adj.get(e.from)?.push({ to: e.to, id: e.id });
    if (!input.directed) adj.get(e.to)?.push({ to: e.from, id: e.id });
  }
  return adj;
}

/** A small connected undirected graph with deterministic preset coordinates (normalised 0..1). */
export function defaultGraph(start = "A"): GraphInput {
  const nodes: GraphNodeInit[] = [
    { id: "A", x: 0.5, y: 0.12 },
    { id: "B", x: 0.24, y: 0.38 },
    { id: "C", x: 0.76, y: 0.38 },
    { id: "D", x: 0.12, y: 0.7 },
    { id: "E", x: 0.4, y: 0.7 },
    { id: "F", x: 0.66, y: 0.7 },
    { id: "G", x: 0.5, y: 0.92 },
  ];
  const pairs: [string, string][] = [
    ["A", "B"],
    ["A", "C"],
    ["B", "D"],
    ["B", "E"],
    ["C", "E"],
    ["C", "F"],
    ["E", "G"],
    ["F", "G"],
  ];
  const edges: GraphEdgeInit[] = pairs.map(([from, to]) => ({ id: `${from}-${to}`, from, to }));
  return { nodes, edges, start, directed: false };
}
