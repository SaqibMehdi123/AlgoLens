import { describe, expect, it } from "vitest";
import { binarySearchSpec, linearSearchSpec, recordTrace, type SearchInput } from "../src";
import { assertLinesValid, sortedRefs } from "./helpers";

const sorted = [4, 8, 15, 16, 23, 42, 56, 71];

describe.each([
  ["linear-search", linearSearchSpec],
  ["binary-search", binarySearchSpec],
] as const)("%s", (_key, spec) => {
  it("locates a present target and marks its index", () => {
    const input: SearchInput = { array: sorted, target: 23 };
    const trace = recordTrace(spec, input);
    assertLinesValid(trace);
    expect(sortedRefs(trace.steps).has(4)).toBe(true); // 23 is at index 4
  });

  it("marks nothing when the target is absent", () => {
    const input: SearchInput = { array: sorted, target: 99 };
    const trace = recordTrace(spec, input);
    assertLinesValid(trace);
    expect(sortedRefs(trace.steps).size).toBe(0);
  });

  it("matches its golden trace for the default input", () => {
    expect(recordTrace(spec, spec.defaultInput()).steps).toMatchSnapshot();
  });
});

describe("binary search efficiency", () => {
  it("examines O(log n) elements, far fewer than linear", () => {
    const big = Array.from({ length: 1024 }, (_, i) => i * 2);
    const binary = recordTrace(binarySearchSpec, { array: big, target: 2046 });
    const compares = binary.steps.filter((s) => s.t === "compare").length;
    expect(compares).toBeLessThanOrEqual(11); // log2(1024) = 10, +1 slack
  });
});
