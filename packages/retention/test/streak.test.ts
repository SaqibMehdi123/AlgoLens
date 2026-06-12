import { describe, expect, it } from "vitest";
import { computeStreak, dayKey } from "../src";

const KARACHI = 300; // UTC+5
const UTC = 0;

describe("dayKey (timezone bucketing)", () => {
  it("buckets by LOCAL calendar date, not UTC", () => {
    // 20:00 UTC on the 10th is 01:00 on the 11th in Karachi.
    const ts = Date.parse("2026-06-10T20:00:00Z");
    expect(dayKey(ts, UTC)).toBe("2026-06-10");
    expect(dayKey(ts, KARACHI)).toBe("2026-06-11");
  });
});

describe("streak survives the timezone edge (Karachi, UTC+5)", () => {
  it("two studies within one Karachi day spanning two UTC days count as ONE day", () => {
    // Both fall on 2026-06-11 in Karachi, but on 06-10 and 06-11 in UTC.
    const t1 = Date.parse("2026-06-10T19:30:00Z"); // Karachi 06-11 00:30
    const t2 = Date.parse("2026-06-11T18:00:00Z"); // Karachi 06-11 23:00

    const karachi = computeStreak([dayKey(t1, KARACHI), dayKey(t2, KARACHI)], "2026-06-11", 0);
    const utc = computeStreak([dayKey(t1, UTC), dayKey(t2, UTC)], "2026-06-11", 0);

    expect(karachi.current).toBe(1); // correct: one local study day
    expect(utc.current).toBe(2); // the bug we avoid by bucketing locally
  });
});

describe("computeStreak", () => {
  const days = (n: number) => {
    const base = Date.parse("2026-06-01T12:00:00Z");
    return Array.from({ length: n }, (_, i) => dayKey(base + i * 86_400_000, UTC));
  };

  it("counts consecutive active days ending today", () => {
    const keys = days(5); // 06-01 .. 06-05
    expect(computeStreak(keys, "2026-06-05", 0).current).toBe(5);
  });

  it("keeps the streak alive on a not-yet-active today (grace)", () => {
    const keys = days(3); // 06-01..06-03
    expect(computeStreak(keys, "2026-06-04", 0).current).toBe(3);
  });

  it("breaks when two days are missed with no freeze", () => {
    const keys = days(3); // 06-01..06-03
    expect(computeStreak(keys, "2026-06-06", 0).current).toBe(0);
  });

  it("a freeze bridges a single missed day", () => {
    // active 06-01, 06-02, (gap 06-03), 06-04 ; today 06-04
    const keys = ["2026-06-01", "2026-06-02", "2026-06-04"];
    expect(computeStreak(keys, "2026-06-04", 0).current).toBe(1); // the gap breaks it → today only
    const withFreeze = computeStreak(keys, "2026-06-04", 1);
    expect(withFreeze.current).toBe(3); // 06-04, freeze bridges 06-03, then 06-02 + 06-01
    expect(withFreeze.freezesUsed).toBe(1);
  });

  it("tracks the longest run independent of the current streak", () => {
    const keys = ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-09", "2026-06-10"];
    expect(computeStreak(keys, "2026-06-10", 0).longest).toBe(3);
  });

  it("reports activeToday", () => {
    expect(computeStreak(["2026-06-05"], "2026-06-05", 0).activeToday).toBe(true);
    expect(computeStreak(["2026-06-04"], "2026-06-05", 0).activeToday).toBe(false);
  });
});
