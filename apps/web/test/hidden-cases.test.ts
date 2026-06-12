/**
 * Rule 6 acceptance test: hidden test cases (is_sample=false) must NEVER be serialized to the
 * client in ANY response shape. Greps the actual serialized payloads of every problem endpoint
 * (and the submission flow) for values that exist ONLY in hidden cases.
 */
import { allStarters, problems } from "@algolens/content";
import { describe, expect, it } from "vitest";
import { GET as getProblems } from "../src/app/api/v1/problems/route";
import { GET as getProblem } from "../src/app/api/v1/problems/[slug]/route";
import { createSubmission, getSubmission } from "../src/lib/submissions";

/** Distinctive JSON fragments present only in hidden cases (not in public statement/samples/stubs). */
function hiddenFragments(slug: string): string[] {
  const p = problems.find((x) => x.slug === slug)!;
  const publicText = [
    p.statementMd,
    p.title,
    ...Object.values(allStarters(p)),
    ...p.cases.filter((c) => c.isSample).flatMap((c) => [JSON.stringify(c.args), JSON.stringify(c.expected)]),
  ].join("\n");
  const frags = new Set<string>();
  for (const c of p.cases.filter((x) => !x.isSample)) {
    for (const piece of [JSON.stringify(c.args), JSON.stringify(c.expected)]) {
      const inner = piece.replace(/^\[+|\]+$/g, ""); // strip outer brackets → distinctive content
      if (inner.length >= 5 && !publicText.includes(inner)) frags.add(inner);
    }
  }
  return [...frags];
}

describe("hidden test cases never leave the server", () => {
  it("problem list payload contains no case data at all", async () => {
    const text = JSON.stringify(await getProblems().json());
    expect(text).not.toContain("expected");
    expect(text).not.toContain("cases");
  });

  it.each(problems.map((p) => [p.slug] as const))("problem detail %s exposes samples only", async (slug) => {
    const res = await getProblem(new Request("http://t/api/v1/problems/" + slug), {
      params: Promise.resolve({ slug }),
    });
    const body = (await res.json()) as { samples: unknown[]; hiddenCaseCount: number };
    const text = JSON.stringify(body);
    for (const frag of hiddenFragments(slug)) {
      expect(text, `hidden data leaked in ${slug}: ${frag}`).not.toContain(frag);
    }
    const p = problems.find((x) => x.slug === slug)!;
    expect(body.samples.length).toBe(p.cases.filter((c) => c.isSample).length);
    expect(body.hiddenCaseCount).toBe(p.cases.filter((c) => !c.isSample).length);
  });

  it("submission view redacts hidden-case output to verdict-only", { timeout: 60_000 }, async () => {
    // An "echo" solution returns its argument — if hidden inputs leaked via stdout excerpts on
    // hidden cases, this would surface them. (Uses missing-number: distinctive hidden arrays.)
    const created = createSubmission({
      problemSlug: "missing-number",
      sourceCode: `function missingNumber(nums){ return nums; }`,
      idempotencyKey: "test-hidden-redaction-fn-1",
      language: "javascript",
    });
    expect("id" in created).toBe(true);
    if (!("id" in created)) return;

    const deadline = Date.now() + 50_000;
    let view = getSubmission(created.id)!;
    while ((view.status === "queued" || view.status === "running") && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 200));
      view = getSubmission(created.id)!;
    }

    const text = JSON.stringify(view);
    for (const frag of hiddenFragments("missing-number")) {
      expect(text, "hidden input leaked via submission view").not.toContain(frag);
    }
    for (const c of view.cases) {
      if (!c.isSample) {
        expect(c.stdoutExcerpt).toBeNull();
        expect(c.stderrExcerpt).toBeNull();
      }
    }
  });

  it("idempotency key dedupes double submits", () => {
    const mk = () =>
      createSubmission({
        problemSlug: "sum-of-array",
        sourceCode: `function sumArray(){ return 0; }`,
        idempotencyKey: "test-idempotent-fn-1",
        language: "javascript",
      });
    const a = mk();
    const b = mk();
    if ("id" in a && "id" in b) {
      expect(b.id).toBe(a.id);
      expect(b.deduplicated).toBe(true);
    } else {
      throw new Error("submission creation failed");
    }
  });
});
