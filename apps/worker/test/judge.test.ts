import { describe, expect, it } from "vitest";
import { judgeSubmission, normalizeOutput } from "../src/judge";

describe("normalizeOutput", () => {
  it("normalizes line endings, trailing spaces, and outer whitespace", () => {
    expect(normalizeOutput("a \r\nb  \n")).toBe("a\nb");
    expect(normalizeOutput("\n\n42\n")).toBe("42");
    expect(normalizeOutput("x")).toBe("x");
  });
});

describe("verdict mapping", () => {
  it("correct solution → accepted with all cases passed", { timeout: 30_000 }, async () => {
    const r = await judgeSubmission({
      sourceCode: `const nums = input.trim().split(/\\s+/).map(Number);
        console.log(nums.reduce((a, b) => a + b, 0));`,
      cases: [
        { input: "1 2 3", expected: "6" },
        { input: "10 -4", expected: "6" },
      ],
    });
    expect(r.verdict).toBe("accepted");
    expect(r.passedCount).toBe(2);
    expect(r.cases.every((c) => c.status === "accepted")).toBe(true);
  });

  it("wrong output → wrong_answer with per-case detail", { timeout: 30_000 }, async () => {
    const r = await judgeSubmission({
      sourceCode: `console.log(999);`,
      cases: [
        { input: "1 2 3", expected: "6" },
        { input: "", expected: "999" },
      ],
    });
    expect(r.verdict).toBe("wrong_answer");
    expect(r.cases[0]!.status).toBe("wrong_answer");
    expect(r.cases[1]!.status).toBe("accepted");
    expect(r.passedCount).toBe(1);
  });

  it("runtime exception → runtime_error with the message excerpted", { timeout: 30_000 }, async () => {
    const r = await judgeSubmission({
      sourceCode: `throw new Error("boom");`,
      cases: [{ input: "", expected: "1" }],
    });
    expect(r.verdict).toBe("runtime_error");
    expect(r.cases[0]!.stderrExcerpt).toContain("boom");
  });

  it("trailing-whitespace differences still pass (normalized compare)", { timeout: 30_000 }, async () => {
    const r = await judgeSubmission({
      sourceCode: `console.log("6  ");`,
      cases: [{ input: "", expected: "6" }],
    });
    expect(r.verdict).toBe("accepted");
  });

  it("compile error stops after the first case", { timeout: 30_000 }, async () => {
    const r = await judgeSubmission({
      sourceCode: `const = broken;`,
      cases: [
        { input: "a", expected: "1" },
        { input: "b", expected: "2" },
      ],
    });
    expect(r.verdict).toBe("compile_error");
    expect(r.cases.length).toBe(1); // early exit — identical for every case
  });
});
