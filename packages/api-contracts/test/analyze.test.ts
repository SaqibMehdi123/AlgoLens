import { describe, expect, it } from "vitest";
import { analysisCreate } from "../src";

describe("analyze contracts", () => {
  it("accepts a complete analysis payload", () => {
    const parsed = analysisCreate.parse({
      sourceCode: "function f(a) { return a[0]; }",
      generatorKey: "random-array",
      staticResult: { bigO: "O(1)", confidence: "high", annotations: [], unresolved: [] },
      empiricalResult: {
        bestFit: "O(1)",
        runnerUp: "O(log n)",
        r2: 0.999,
        samples: [{ n: 16, ms: 0.01, ops: 1 }],
        budgetExhausted: false,
        measure: "ops",
      },
      finalEstimate: "O(1)",
      confidence: "high",
    });
    expect(parsed.language).toBe("javascript"); // default applied
    expect(parsed.isPublic).toBe(false);
  });

  it("rejects oversized source and bad generator keys", () => {
    expect(() =>
      analysisCreate.parse({
        sourceCode: "x".repeat(30_000),
        generatorKey: "random-array",
        staticResult: null,
        empiricalResult: null,
        finalEstimate: null,
        confidence: "low",
      }),
    ).toThrow();
    expect(() =>
      analysisCreate.parse({
        sourceCode: "f",
        generatorKey: "evil",
        staticResult: null,
        empiricalResult: null,
        finalEstimate: null,
        confidence: "low",
      }),
    ).toThrow();
  });
});
