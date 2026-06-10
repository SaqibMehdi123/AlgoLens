import { describe, expect, it } from "vitest";
import {
  assertValidLines,
  recordTrace,
  vars,
  type AlgorithmSpec,
  type Step,
} from "../src";

/** A pathological generator that never stops — exercises the recorder's hard caps (TRD §4.2). */
const infiniteSpec: AlgorithmSpec<number[]> = {
  key: "infinite",
  title: "Infinite",
  category: "sorting",
  layout: "array",
  pseudocode: ["loop forever"],
  complexity: { best: "∞", average: "∞", worst: "∞", space: "O(1)" },
  maxInputSize: 10,
  defaultInput: () => [1],
  buildView: (input) => ({ kind: "array", values: input.slice() }),
  *run(): Generator<Step> {
    for (let i = 0; ; i++) yield vars({ i }, 1);
  },
};

describe("recorder caps", () => {
  it("stops at maxSteps and flags the trace as capped", () => {
    const trace = recordTrace(infiniteSpec, [1], { maxSteps: 500 });
    expect(trace.steps.length).toBe(500);
    expect(trace.meta.capped).toBe(true);
    expect(trace.meta.stepCount).toBe(500);
  });

  it("does not mutate the caller's input", () => {
    const input = [5, 3, 1];
    const before = [...input];
    recordTrace(infiniteSpec, input, { maxSteps: 10 });
    expect(input).toEqual(before);
  });

  it("records step-type counts", () => {
    const trace = recordTrace(infiniteSpec, [1], { maxSteps: 7 });
    expect(trace.meta.counts.vars).toBe(7);
  });
});

describe("assertValidLines", () => {
  it("throws on an out-of-range line", () => {
    const trace = recordTrace(infiniteSpec, [1], { maxSteps: 1 });
    trace.steps.push({ t: "vars", values: {}, line: 99 });
    expect(() => assertValidLines(trace)).toThrow(/invalid line/);
  });
});
