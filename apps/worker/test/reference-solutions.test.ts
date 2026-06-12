/**
 * Every problem's JS reference solution must return the authored `expected` value for EVERY case
 * through the real judge (the new function harness). A reference that can't reproduce an expected
 * value fails CI — keeping problems honest.
 */
import { problems } from "@algolens/content";
import { describe, expect, it } from "vitest";
import { judgeSubmission } from "../src/judge";

describe("reference solutions pass their own cases", () => {
  it.each(problems.map((p) => [p.slug, p] as const))(
    "%s reference is accepted",
    { timeout: 60_000 },
    async (_slug, problem) => {
      const r = await judgeSubmission({
        language: "javascript",
        sourceCode: problem.referenceSolution,
        functionName: problem.functionName,
        compare: problem.compare,
        cases: problem.cases.map((c) => ({ args: c.args, expected: c.expected })),
        timeLimitMs: problem.timeLimitMs,
      });
      const failures = r.cases
        .map((c, i) => ({ ...c, i }))
        .filter((c) => c.status !== "accepted")
        .map((c) => `case ${c.i}: ${c.status} (got ${JSON.stringify(c.stdoutExcerpt)})`);
      expect(r.verdict, failures.join("; ")).toBe("accepted");
      expect(r.passedCount).toBe(problem.cases.length);
    },
  );
});
