import { describe, expect, it } from "vitest";
import { flattenLessons, getProblem, problems, tracks } from "../src";

describe("problems manifest", () => {
  it("ships exactly 15 problems with unique slugs", () => {
    expect(problems.length).toBe(15);
    expect(new Set(problems.map((p) => p.slug)).size).toBe(15);
  });

  it.each(problems.map((p) => [p.slug, p] as const))("%s is well-formed", (_slug, p) => {
    expect(p.statementMd.length).toBeGreaterThan(40);
    expect(p.starterCode).toContain("input");
    expect(p.referenceSolution).toContain("console.log");
    expect(p.timeLimitMs).toBeGreaterThanOrEqual(500);
    // At least 2 public samples AND at least 2 hidden cases (rule 6 needs something to protect).
    expect(p.cases.filter((c) => c.isSample).length).toBeGreaterThanOrEqual(2);
    expect(p.cases.filter((c) => !c.isSample).length).toBeGreaterThanOrEqual(2);
    for (const c of p.cases) expect(c.expected.length).toBeGreaterThan(0);
  });

  it("every problem's lessonSlug points to a real lesson", () => {
    const lessonSlugs = new Set(tracks.flatMap((t) => flattenLessons(t)).map((l) => l.slug));
    for (const p of problems) {
      if (p.lessonSlug) expect(lessonSlugs.has(p.lessonSlug), `${p.slug} → ${p.lessonSlug}`).toBe(true);
    }
  });

  it("every lesson practiceSlug points to a real problem", () => {
    for (const lesson of tracks.flatMap((t) => flattenLessons(t))) {
      if (lesson.practiceSlug) {
        expect(getProblem(lesson.practiceSlug), `${lesson.slug} → ${lesson.practiceSlug}`).toBeDefined();
      }
    }
  });
});
