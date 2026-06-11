/**
 * Rule 6 acceptance test: hidden test cases (is_sample=false) must NEVER be serialized to the
 * client in ANY response shape. This greps the actual serialized payloads of every problem
 * endpoint — and the submission flow — for every hidden input/expected string.
 */
import { problems } from "@algolens/content";
import { describe, expect, it } from "vitest";
import { GET as getProblems } from "../src/app/api/v1/problems/route";
import { GET as getProblem } from "../src/app/api/v1/problems/[slug]/route";
import { createSubmission, getSubmission } from "../src/lib/submissions";

/**
 * Strings that exist ONLY in hidden cases — values also present in public content (samples,
 * statement, starter code) would false-positive the grep without indicating a leak.
 */
function hiddenStringsOf(slug: string): string[] {
  const p = problems.find((x) => x.slug === slug)!;
  const publicText = [
    p.statementMd,
    p.starterCode,
    p.title,
    ...p.cases.filter((c) => c.isSample).flatMap((c) => [c.input, c.expected]),
  ].join("\n");
  return p.cases
    .filter((c) => !c.isSample)
    .flatMap((c) => [c.input, c.expected])
    .filter((s) => s.length >= 4 && !publicText.includes(s));
}

describe("hidden test cases never leave the server", () => {
  it("problem list payload contains no case data at all", async () => {
    const res = getProblems();
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain("expected");
    expect(text).not.toContain("cases");
  });

  it.each(problems.map((p) => [p.slug] as const))(
    "problem detail %s carries samples only",
    async (slug) => {
      const res = await getProblem(new Request("http://test/api/v1/problems/" + slug), {
        params: Promise.resolve({ slug }),
      });
      const body = (await res.json()) as { samples: unknown[]; hiddenCaseCount: number };
      const text = JSON.stringify(body);
      for (const hidden of hiddenStringsOf(slug)) {
        expect(text, `hidden case data leaked in ${slug}`).not.toContain(JSON.stringify(hidden).slice(1, -1));
      }
      const problem = problems.find((p) => p.slug === slug)!;
      expect(body.samples.length).toBe(problem.cases.filter((c) => c.isSample).length);
      expect(body.hiddenCaseCount).toBe(problem.cases.filter((c) => !c.isSample).length);
    },
  );

  it(
    "submission view redacts hidden-case output to verdict-only",
    { timeout: 60_000 },
    async () => {
      // A submission that ECHOES the input — if hidden inputs leaked through stdout excerpts,
      // this would catch it.
      const created = createSubmission({
        problemSlug: "sum-of-array",
        sourceCode: `console.log(input);`,
        idempotencyKey: "test-hidden-redaction-1",
      });
      expect("id" in created).toBe(true);
      if (!("id" in created)) return;

      // Wait for judging to finish.
      const deadline = Date.now() + 50_000;
      let view = getSubmission(created.id)!;
      while ((view.status === "queued" || view.status === "running") && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 200));
        view = getSubmission(created.id)!;
      }

      const text = JSON.stringify(view);
      for (const hidden of hiddenStringsOf("sum-of-array")) {
        expect(text, "hidden input leaked via submission view").not.toContain(hidden);
      }
      for (const c of view.cases) {
        if (!c.isSample) {
          expect(c.stdoutExcerpt).toBeNull();
          expect(c.stderrExcerpt).toBeNull();
        }
      }
    },
  );

  it("idempotency key dedupes double submits", () => {
    const a = createSubmission({
      problemSlug: "sum-of-array",
      sourceCode: "console.log(0)",
      idempotencyKey: "test-idempotent-key-1",
    });
    const b = createSubmission({
      problemSlug: "sum-of-array",
      sourceCode: "console.log(0)",
      idempotencyKey: "test-idempotent-key-1",
    });
    if ("id" in a && "id" in b) {
      expect(b.id).toBe(a.id);
      expect(b.deduplicated).toBe(true);
    } else {
      throw new Error("submission creation failed");
    }
  });
});
