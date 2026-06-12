import { describe, expect, it } from "vitest";
import { levelForXp, levelInfo, totalXp, xpForLevel, type XpEvent } from "../src";

describe("level curve", () => {
  it("requires a growing cumulative XP per level", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(300);
    expect(xpForLevel(4)).toBe(600);
    expect(xpForLevel(5)).toBe(1000);
  });

  it("maps XP to the right level", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(299)).toBe(2);
    expect(levelForXp(300)).toBe(3);
    expect(levelForXp(1000)).toBe(5);
  });

  it("reports progress within the current level", () => {
    const info = levelInfo(150);
    expect(info.level).toBe(2);
    expect(info.xpIntoLevel).toBe(50);
    expect(info.xpForNextLevel).toBe(150);
    expect(info.progress).toBeCloseTo(0.25, 10);
  });
});

describe("totalXp (ledger projection)", () => {
  it("sums the append-only event ledger", () => {
    const events: XpEvent[] = [
      { amount: 50, reason: "lesson_completed", at: 1 },
      { amount: 30, reason: "problem_solved", at: 2 },
      { amount: 5, reason: "review_completed", at: 3 },
    ];
    expect(totalXp(events)).toBe(85);
    expect(totalXp([])).toBe(0);
  });
});
