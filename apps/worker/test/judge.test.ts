import { describe, expect, it } from "vitest";
import { judgeSubmission, resultsEqual, type JudgeCase } from "../src/judge";

const sumArray = `function sumArray(nums){ let t=0; for(const v of nums) t+=v; return t; }`;
const cases = (...cs: JudgeCase[]) => cs;

describe("resultsEqual", () => {
  it("exact = deep equal", () => {
    expect(resultsEqual([1, 2], [1, 2], "exact")).toBe(true);
    expect(resultsEqual([1, 2], [2, 1], "exact")).toBe(false);
    expect(resultsEqual("ab", "ab", "exact")).toBe(true);
  });
  it("unordered = multiset over a top-level array", () => {
    expect(resultsEqual([2, 1, 3], [1, 2, 3], "unordered")).toBe(true);
    expect(resultsEqual([1, 1, 2], [1, 2, 2], "unordered")).toBe(false);
  });
});

describe("function-harness verdicts", () => {
  it("accepted when the function returns the expected value for every case", { timeout: 20000 }, async () => {
    const r = await judgeSubmission({
      language: "javascript",
      sourceCode: sumArray,
      functionName: "sumArray",
      compare: "exact",
      cases: cases({ args: [[1, 2, 3]], expected: 6 }, { args: [[10, -4]], expected: 6 }),
    });
    expect(r.verdict).toBe("accepted");
    expect(r.passedCount).toBe(2);
    expect(r.cases[0]!.stdoutExcerpt).toBe("6"); // returned value shown for samples
  });

  it("wrong_answer with the returned value captured", { timeout: 20000 }, async () => {
    const r = await judgeSubmission({
      language: "javascript",
      sourceCode: `function f(a){ return 0; }`,
      functionName: "f",
      cases: cases({ args: [[1]], expected: 1 }, { args: [[2]], expected: 2 }),
    });
    expect(r.verdict).toBe("wrong_answer");
    expect(r.cases[0]!.status).toBe("wrong_answer");
    expect(r.cases[0]!.stdoutExcerpt).toBe("0");
  });

  it("runtime_error on throw", { timeout: 20000 }, async () => {
    const r = await judgeSubmission({
      language: "javascript",
      sourceCode: `function f(){ throw new Error("boom"); }`,
      functionName: "f",
      cases: cases({ args: [], expected: 1 }),
    });
    expect(r.verdict).toBe("runtime_error");
    expect(r.cases[0]!.stderrExcerpt).toContain("boom");
  });

  it("runtime_error when the function is missing / misnamed", { timeout: 20000 }, async () => {
    const r = await judgeSubmission({
      language: "javascript",
      sourceCode: `function wrongName(){ return 1; }`,
      functionName: "twoSum",
      cases: cases({ args: [[], 0], expected: [] }),
    });
    expect(r.verdict).toBe("runtime_error");
    expect(r.cases[0]!.stderrExcerpt).toMatch(/not defined/);
  });

  it("compile_error on a syntax error (one row, no per-case run)", { timeout: 20000 }, async () => {
    const r = await judgeSubmission({
      language: "javascript",
      sourceCode: `function f({ ]`,
      functionName: "f",
      cases: cases({ args: [], expected: 1 }, { args: [], expected: 2 }),
    });
    expect(r.verdict).toBe("compile_error");
    expect(r.cases.length).toBe(1);
  });

  it("judges TypeScript by transpiling type annotations away", { timeout: 20000 }, async () => {
    const r = await judgeSubmission({
      language: "typescript",
      sourceCode: `function add(a: number, b: number): number {\n  const xs: number[] = [a, b];\n  return xs.reduce((p, c) => p + c, 0);\n}`,
      functionName: "add",
      cases: cases({ args: [2, 3], expected: 5 }, { args: [-1, 1], expected: 0 }),
    });
    expect(r.verdict).toBe("accepted");
  });

  it("honours the unordered compare mode", { timeout: 20000 }, async () => {
    const r = await judgeSubmission({
      language: "javascript",
      sourceCode: `function f(a){ return a.slice().reverse(); }`,
      functionName: "f",
      compare: "unordered",
      cases: cases({ args: [[1, 2, 3]], expected: [3, 2, 1] }, { args: [[1, 2, 3]], expected: [2, 1, 3] }),
    });
    expect(r.verdict).toBe("accepted");
  });
});
