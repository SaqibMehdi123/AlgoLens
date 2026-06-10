import { describe, expect, it } from "vitest";
import { progressPut, quizAttemptCreate, trackSummary } from "../src";

describe("learn contracts", () => {
  it("accepts a valid track summary", () => {
    const parsed = trackSummary.parse({
      slug: "dsa-foundations",
      title: "DSA Foundations",
      description: "d",
      level: "intro",
      position: 1,
      lessonCount: 3,
      modules: [
        {
          slug: "complexity",
          title: "Thinking in Complexity",
          position: 1,
          lessons: [
            {
              slug: "big-o-notation",
              title: "Big-O Notation",
              summary: "s",
              estMinutes: 10,
              difficulty: "intro",
              position: 1,
              quizCount: 2,
              prerequisites: [],
              practiceSlug: null,
            },
          ],
        },
      ],
    });
    expect(parsed.modules[0]!.lessons[0]!.quizCount).toBe(2);
  });

  it("rejects out-of-range scroll percentages", () => {
    expect(() => progressPut.parse({ status: "in_progress", scrollPct: 101 })).toThrow();
    expect(progressPut.parse({ status: "completed", scrollPct: 100 }).status).toBe("completed");
  });

  it("accepts single and multi-select quiz responses", () => {
    expect(
      quizAttemptCreate.parse({
        lessonSlug: "big-o-notation",
        quizId: "nested-loop-class",
        response: 2,
        isCorrect: true,
      }).response,
    ).toBe(2);
    expect(
      quizAttemptCreate.parse({
        lessonSlug: "big-o-notation",
        quizId: "multi",
        response: [0, 2],
        isCorrect: false,
      }).response,
    ).toEqual([0, 2]);
  });
});
