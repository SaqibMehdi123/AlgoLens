import { describe, expect, it } from "vitest";
import { bfsSpec, dfsSpec, defaultGraph, recordTrace } from "../src";
import { assertLinesValid } from "./helpers";

const allNodes = defaultGraph().nodes.map((n) => n.id);

function visitedIds(steps: { t: string; ref?: unknown }[]): Set<string> {
  const out = new Set<string>();
  for (const s of steps) if (s.t === "visit") out.add(s.ref as string);
  return out;
}

describe("BFS", () => {
  it("visits every node in a connected graph exactly once", () => {
    const trace = recordTrace(bfsSpec, bfsSpec.defaultInput());
    assertLinesValid(trace);
    const visits = trace.steps.filter((s) => s.t === "visit");
    expect(visits.length).toBe(allNodes.length);
    expect(visitedIds(trace.steps)).toEqual(new Set(allNodes));
  });

  it("discovers each node once (enqueue count = |V|)", () => {
    const trace = recordTrace(bfsSpec, bfsSpec.defaultInput());
    expect(trace.steps.filter((s) => s.t === "enqueue").length).toBe(allNodes.length);
  });

  it("matches its golden trace", () => {
    expect(recordTrace(bfsSpec, bfsSpec.defaultInput()).steps).toMatchSnapshot();
  });
});

describe("DFS", () => {
  it("visits every node in a connected graph", () => {
    const trace = recordTrace(dfsSpec, dfsSpec.defaultInput());
    assertLinesValid(trace);
    expect(visitedIds(trace.steps)).toEqual(new Set(allNodes));
  });

  it("keeps the call stack balanced (every push has a matching pop)", () => {
    const trace = recordTrace(dfsSpec, dfsSpec.defaultInput());
    const pushes = trace.steps.filter((s) => s.t === "callPush").length;
    const pops = trace.steps.filter((s) => s.t === "callPop").length;
    expect(pushes).toBe(pops);
    expect(pushes).toBe(allNodes.length);
  });

  it("matches its golden trace", () => {
    expect(recordTrace(dfsSpec, dfsSpec.defaultInput()).steps).toMatchSnapshot();
  });
});
