import { describe, expect, it } from "vitest";
import { dueQueueResponse, gradeRequest, reviewGrade, statsResponse } from "../src";

describe("review contracts", () => {
  it("accepts the four SM-2 grades and rejects others", () => {
    for (const g of ["again", "hard", "good", "easy"]) {
      expect(gradeRequest.parse({ grade: g }).grade).toBe(g);
    }
    expect(() => gradeRequest.parse({ grade: "perfect" })).toThrow();
    expect(reviewGrade.options).toEqual(["again", "hard", "good", "easy"]);
  });

  it("validates a due queue payload", () => {
    const parsed = dueQueueResponse.parse({
      due: [
        {
          id: "c1",
          sourceKind: "lesson",
          sourceId: "big-o-notation",
          frontMdx: "Complexity of binary search?",
          backMdx: "O(log n)",
          easeFactor: 2.5,
          intervalDays: 0,
          repetitions: 0,
          dueAt: 1_700_000_000_000,
        },
      ],
      total: 1,
    });
    expect(parsed.due[0]!.sourceKind).toBe("lesson");
  });

  it("validates the stats projection shape", () => {
    const parsed = statsResponse.parse({
      xpTotal: 150,
      level: 2,
      xpIntoLevel: 50,
      xpForNextLevel: 150,
      currentStreak: 3,
      longestStreak: 5,
      streakFreezes: 1,
      lessonsCompleted: 2,
      problemsSolved: 4,
      reviewsCompleted: 12,
      dueCount: 5,
    });
    expect(parsed.level).toBe(2);
  });
});
