import { describe, expect, it } from "vitest";
import {
  dueCards,
  easeDelta,
  GRADE_QUALITY,
  initialSrsState,
  intervalPreview,
  nextEaseFactor,
  schedule,
  type SrsState,
} from "../src";

const MS_PER_DAY = 86_400_000;

describe("SM-2 ease factor (canonical deltas)", () => {
  it.each([
    [5, 0.1],
    [4, 0],
    [3, -0.14],
    [2, -0.32],
    [1, -0.54],
    [0, -0.8],
  ])("quality %i → EF delta %f", (q, delta) => {
    expect(easeDelta(q)).toBeCloseTo(delta, 10);
  });

  it("clamps EF to a 1.3 floor", () => {
    expect(nextEaseFactor(1.3, 0)).toBe(1.3);
    expect(nextEaseFactor(2.5, 1)).toBeCloseTo(1.96, 10);
    expect(nextEaseFactor(2.5, 5)).toBeCloseTo(2.6, 10);
  });
});

describe("SM-2 interval progression", () => {
  it("follows 1 → 6 → round(I·EF) for repeated correct grades", () => {
    let s: SrsState = initialSrsState();
    const intervals: number[] = [];
    for (let i = 0; i < 4; i++) {
      const r = schedule(s, "easy", 0);
      intervals.push(r.intervalDays);
      s = r;
    }
    expect(intervals).toEqual([1, 6, 16, 45]);
    expect(s.easeFactor).toBeCloseTo(2.9, 10);
  });

  it("a lapse (Again) resets repetitions and interval, lowers EF", () => {
    const mature: SrsState = { easeFactor: 2.6, intervalDays: 30, repetitions: 5 };
    const r = schedule(mature, "again", 0);
    expect(r.repetitions).toBe(0);
    expect(r.intervalDays).toBe(1);
    expect(r.easeFactor).toBeCloseTo(2.6 - 0.54, 10);
  });

  it("sets dueAt = reviewedAt + interval days", () => {
    const r = schedule(initialSrsState(), "good", 1_000_000);
    expect(r.dueAt).toBe(1_000_000 + 1 * MS_PER_DAY);
  });

  it("maps Again/Hard/Good/Easy to qualities 1/3/4/5", () => {
    expect(GRADE_QUALITY).toEqual({ again: 1, hard: 3, good: 4, easy: 5 });
  });
});

describe("intervalPreview", () => {
  it("previews each grade's resulting interval for the button labels", () => {
    const mature: SrsState = { easeFactor: 2.5, intervalDays: 10, repetitions: 3 };
    const preview = intervalPreview(mature);
    expect(preview.again).toBe(1);
    expect(preview.good).toBe(Math.round(10 * 2.5));
    expect(preview.easy).toBeGreaterThanOrEqual(preview.good);
  });
});

describe("dueCards", () => {
  it("returns non-suspended cards due now, soonest first", () => {
    const now = 1_000_000_000;
    const cards = [
      { id: "a", dueAt: now - 100 },
      { id: "b", dueAt: now + 5000 },
      { id: "c", dueAt: now - 5000 },
      { id: "d", dueAt: now - 10, suspended: true },
    ];
    expect(dueCards(cards, now).map((c) => c.id)).toEqual(["c", "a"]);
  });
});
