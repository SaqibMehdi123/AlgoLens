import { getAlgo } from "@algolens/algo-core";
import { describe, expect, it } from "vitest";
import { buildInput, controlsFor, defaultControls } from "../src/lib/input";

describe("buildInput", () => {
  it("produces a sorted array for binary search regardless of order", () => {
    const entry = getAlgo("binary-search")!;
    const input = buildInput(entry, { ...defaultControls(entry), order: "reversed" }) as {
      array: number[];
      target: number;
    };
    expect(input.array).toEqual([...input.array].sort((a, b) => a - b));
    expect(typeof input.target).toBe("number");
  });

  it("produces distinct values for BST", () => {
    const entry = getAlgo("bst-insert")!;
    const values = buildInput(entry, { ...defaultControls(entry), size: 8, seed: 5 }) as number[];
    expect(new Set(values).size).toBe(values.length);
  });

  it("respects custom values when provided", () => {
    const entry = getAlgo("bubble-sort")!;
    const values = buildInput(entry, {
      ...defaultControls(entry),
      customValues: [9, 1, 5],
    }) as number[];
    expect(values).toEqual([9, 1, 5]);
  });

  it("exposes the right controls per algorithm", () => {
    expect(controlsFor(getAlgo("bfs")!)).toMatchObject({ size: false, order: false });
    expect(controlsFor(getAlgo("binary-search")!)).toMatchObject({ target: true, order: false });
  });
});
