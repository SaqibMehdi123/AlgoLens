import { describe, expect, it } from "vitest";
import { bstInsertSpec, bstSearchSpec, recordTrace } from "../src";
import { assertLinesValid, sortedRefs } from "./helpers";

describe("BST insert", () => {
  it("computes correct parent/side links", () => {
    const view = bstInsertSpec.buildView([8, 3, 10]);
    expect(view.kind).toBe("tree");
    if (view.kind !== "tree") return;
    expect(view.nodes).toEqual([
      { id: "8", value: 8, parent: null, present: false },
      { id: "3", value: 3, parent: "8", side: "left", present: false },
      { id: "10", value: 10, parent: "8", side: "right", present: false },
    ]);
  });

  it("reveals every inserted value exactly once via a set step", () => {
    const input = [8, 3, 10, 1, 6, 14, 4, 7, 13];
    const trace = recordTrace(bstInsertSpec, input);
    assertLinesValid(trace);
    const revealed = trace.steps.filter((s) => s.t === "set").map((s) => (s as { ref: string }).ref);
    expect(revealed.sort()).toEqual(input.map(String).sort());
  });

  it("matches its golden trace", () => {
    expect(recordTrace(bstInsertSpec, bstInsertSpec.defaultInput()).steps).toMatchSnapshot();
  });
});

describe("BST search", () => {
  it("finds a present value and marks the node", () => {
    const trace = recordTrace(bstSearchSpec, { values: [8, 3, 10, 1, 6, 14, 4, 7, 13], target: 7 });
    assertLinesValid(trace);
    expect(sortedRefs(trace.steps).has("7")).toBe(true);
  });

  it("walks the correct root→leaf path length for a present value", () => {
    // 7 lives at depth 3 (8 → 3 → 6 → 7): exactly 4 nodes become active.
    const trace = recordTrace(bstSearchSpec, { values: [8, 3, 10, 1, 6, 14, 4, 7, 13], target: 7 });
    const visited = trace.steps.filter((s) => s.t === "highlight" && s.refs.length === 1);
    expect(visited.length).toBe(4);
  });

  it("marks nothing when the value is absent", () => {
    const trace = recordTrace(bstSearchSpec, { values: [8, 3, 10], target: 5 });
    expect(sortedRefs(trace.steps).size).toBe(0);
  });
});
