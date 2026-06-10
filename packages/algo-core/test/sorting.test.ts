import { describe, expect, it } from "vitest";
import {
  bubbleSort,
  bubbleSortSpec,
  heapSortSpec,
  insertionSortSpec,
  mergeSortSpec,
  quickSortSpec,
  recordTrace,
  selectionSortSpec,
  type AlgorithmSpec,
  type Step,
} from "../src";
import { assertLinesValid, isSorted, replayArray, sortedRefs } from "./helpers";

const sorts: AlgorithmSpec<number[]>[] = [
  bubbleSortSpec,
  insertionSortSpec,
  selectionSortSpec,
  mergeSortSpec,
  quickSortSpec,
  heapSortSpec,
];

const inputs: Record<string, number[]> = {
  "already sorted": [1, 2, 3, 4, 5, 6],
  reversed: [6, 5, 4, 3, 2, 1],
  "with duplicates": [3, 1, 3, 2, 1, 2],
  random: [5, 3, 8, 4, 2, 7, 1, 6],
  single: [42],
  empty: [],
};

describe.each(sorts)("$title", (spec) => {
  it.each(Object.entries(inputs))("sorts the %s input correctly", (_label, input) => {
    const trace = recordTrace(spec, input);
    const result = replayArray(trace);
    expect(result).toEqual([...input].sort((a, b) => a - b));
    expect(isSorted(result)).toBe(true);
    expect(trace.meta.capped).toBe(false);
  });

  it("emits only valid pseudocode lines", () => {
    assertLinesValid(recordTrace(spec, inputs.random!));
  });

  it("marks every index as sorted by the end", () => {
    const trace = recordTrace(spec, inputs.random!);
    const marked = sortedRefs(trace.steps);
    for (let i = 0; i < inputs.random!.length; i++) expect(marked.has(i)).toBe(true);
  });

  it("matches its golden trace for the default input", () => {
    const trace = recordTrace(spec, spec.defaultInput());
    expect(trace.steps).toMatchSnapshot();
  });
});

describe("bubbleSort exact golden trace", () => {
  it("produces the hand-verified step sequence for [3,1,2]", () => {
    const steps = [...bubbleSort([3, 1, 2])];
    const expected: Step[] = [
      { t: "vars", values: { i: 0 }, line: 1 },
      { t: "vars", values: { j: 0 }, line: 2 },
      { t: "compare", a: 0, b: 1, line: 3 },
      { t: "swap", a: 0, b: 1, line: 4 },
      { t: "vars", values: { j: 1 }, line: 2 },
      { t: "compare", a: 1, b: 2, line: 3 },
      { t: "swap", a: 1, b: 2, line: 4 },
      { t: "markSorted", refs: [2], line: 5 },
      { t: "vars", values: { i: 1 }, line: 1 },
      { t: "vars", values: { j: 0 }, line: 2 },
      { t: "compare", a: 0, b: 1, line: 3 },
      { t: "markSorted", refs: [1], line: 5 },
      { t: "markSorted", refs: [0], line: 5 },
    ];
    expect(steps).toEqual(expected);
  });
});
