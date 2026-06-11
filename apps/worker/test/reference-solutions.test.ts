/**
 * Every problem's reference solution must produce the authored `expected` output for EVERY
 * case, through the real judge. This is the executable form of "reference solutions generate
 * expected outputs" — an expected value that the reference cannot reproduce fails CI.
 */
import { problems } from "@algolens/content";
import { describe, expect, it } from "vitest";
import { judgeSubmission } from "../src/judge";

describe("reference solutions generate the expected outputs", () => {
  it.each(problems.map((p) => [p.slug, p] as const))(
    "%s reference passes all of its own cases",
    { timeout: 60_000 },
    async (_slug, problem) => {
      const r = await judgeSubmission({
        sourceCode: problem.referenceSolution,
        cases: problem.cases.map((c) => ({ input: c.input, expected: c.expected })),
        timeLimitMs: problem.timeLimitMs,
      });
      const failing = r.cases
        .map((c, i) => ({ ...c, i }))
        .filter((c) => c.status !== "accepted")
        .map((c) => `case ${c.i}: ${c.status} (got ${JSON.stringify(c.stdoutExcerpt)})`);
      expect(r.verdict, failing.join("; ")).toBe("accepted");
      expect(r.passedCount).toBe(problem.cases.length);
    },
  );
});
