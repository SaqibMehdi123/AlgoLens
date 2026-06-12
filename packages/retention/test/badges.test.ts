import { describe, expect, it } from "vitest";
import { BADGES, evaluateBadges, meetsCriteria, type StatsSnapshot } from "../src";

const base: StatsSnapshot = {
  lessonsCompleted: 0,
  problemsSolved: 0,
  problemsSolvedByTag: {},
  reviewsCompleted: 0,
  currentStreak: 0,
  level: 1,
};

describe("badge evaluator", () => {
  it("awards nothing for an empty profile", () => {
    expect(evaluateBadges(base)).toEqual([]);
  });

  it("awards count-threshold badges", () => {
    const earned = evaluateBadges({ ...base, lessonsCompleted: 3, problemsSolved: 1 });
    expect(earned).toContain("first-lesson");
    expect(earned).toContain("scholar");
    expect(earned).toContain("first-solve");
    expect(earned).not.toContain("solver-10");
  });

  it("evaluates tag-scoped criteria", () => {
    expect(
      meetsCriteria(
        { kind: "problems_solved", count: 5, tag: "graphs" },
        { ...base, problemsSolvedByTag: { graphs: 5 } },
      ),
    ).toBe(true);
    expect(
      meetsCriteria(
        { kind: "problems_solved", count: 5, tag: "graphs" },
        { ...base, problemsSolved: 100, problemsSolvedByTag: { arrays: 100 } },
      ),
    ).toBe(false);
  });

  it("awards streak and level badges", () => {
    const earned = evaluateBadges({ ...base, currentStreak: 30, level: 5 });
    expect(earned).toEqual(expect.arrayContaining(["streak-7", "streak-30", "level-5"]));
  });

  it("every badge has a unique slug and a data-driven criteria", () => {
    expect(new Set(BADGES.map((b) => b.slug)).size).toBe(BADGES.length);
    for (const b of BADGES) expect(b.criteria).toHaveProperty("kind");
  });
});
