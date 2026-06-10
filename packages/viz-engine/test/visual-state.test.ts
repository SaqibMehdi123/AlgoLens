import { bubbleSortSpec, recordTrace } from "@algolens/algo-core";
import { describe, expect, it } from "vitest";
import { clampFrame, deriveState, elementStatus } from "../src/state/visual-state";

const trace = recordTrace(bubbleSortSpec, [5, 3, 8, 1]);

describe("deriveState", () => {
  it("frame 0 is the untouched initial input", () => {
    expect(deriveState(trace, 0).values).toEqual([5, 3, 8, 1]);
    expect(deriveState(trace, 0).currentLine).toBeNull();
  });

  it("the last frame is fully sorted", () => {
    const last = deriveState(trace, trace.steps.length);
    expect(last.values).toEqual([1, 3, 5, 8]);
    for (let i = 0; i < 4; i++) expect(last.sorted.has(i)).toBe(true);
  });

  it("is pure — re-deriving the same frame yields a deep-equal state (exact backward stepping)", () => {
    for (let f = 0; f <= trace.steps.length; f++) {
      expect(deriveState(trace, f)).toEqual(deriveState(trace, f));
    }
  });

  it("stepping forward then back reproduces the earlier state exactly", () => {
    const f = 6;
    const before = deriveState(trace, f);
    deriveState(trace, f + 1); // "step forward"
    const back = deriveState(trace, f); // "step back"
    expect(back).toEqual(before);
  });

  it("derives values by folding swaps — matches a manual replay at every frame", () => {
    for (let f = 0; f <= trace.steps.length; f++) {
      const manual = [...trace.view.kind === "array" ? trace.view.values : []];
      for (let k = 0; k < f; k++) {
        const s = trace.steps[k]!;
        if (s.t === "swap") {
          const a = s.a as number;
          const b = s.b as number;
          [manual[a], manual[b]] = [manual[b]!, manual[a]!];
        }
      }
      expect(deriveState(trace, f).values).toEqual(manual);
    }
  });

  it("clamps out-of-range frames", () => {
    expect(clampFrame(trace, -5)).toBe(0);
    expect(clampFrame(trace, 9999)).toBe(trace.steps.length);
  });

  it("marks a compare as transient for the current frame only", () => {
    const compareFrame = trace.steps.findIndex((s) => s.t === "compare") + 1;
    const at = deriveState(trace, compareFrame);
    expect(at.comparing.length).toBe(2);
    // a later frame whose step is not a compare clears it
    const next = deriveState(trace, compareFrame + 1);
    if (trace.steps[compareFrame]?.t !== "compare") expect(next.comparing.length).toBe(0);
  });

  it("resolves element status by priority", () => {
    const last = deriveState(trace, trace.steps.length);
    expect(elementStatus(last, 0)).toBe("sorted");
  });
});
