import { expect } from "vitest";
import type { Step, Trace } from "../src";

/**
 * Replays array `swap`/`set` steps over the initial view — the same fold the viz-engine reducer
 * performs — so tests can assert an algorithm actually transforms the array correctly, not merely
 * that its step sequence is stable.
 */
export function replayArray(trace: Trace): number[] {
  if (trace.view.kind !== "array") throw new Error("replayArray expects an array view");
  const values = [...trace.view.values];
  for (const step of trace.steps) {
    if (step.t === "swap") {
      const a = step.a as number;
      const b = step.b as number;
      [values[a], values[b]] = [values[b]!, values[a]!];
    } else if (step.t === "set") {
      values[step.ref as number] = step.value as number;
    }
  }
  return values;
}

export function isSorted(values: number[]): boolean {
  return values.every((v, i) => i === 0 || values[i - 1]! <= v);
}

/** TRD §4.2 invariant: every step's `line` is a valid 1-based index into the pseudocode. */
export function assertLinesValid(trace: Trace): void {
  for (const [i, step] of trace.steps.entries()) {
    expect(
      step.line,
      `step ${i} (${step.t}) line out of range`,
    ).toBeGreaterThanOrEqual(1);
    expect(step.line, `step ${i} (${step.t}) line out of range`).toBeLessThanOrEqual(
      trace.pseudocode.length,
    );
  }
}

/** The set of element ids ever marked sorted (mint) across the whole trace. */
export function sortedRefs(steps: Step[]): Set<number | string> {
  const out = new Set<number | string>();
  for (const step of steps) {
    if (step.t === "markSorted") for (const r of step.refs) out.add(r);
  }
  return out;
}
