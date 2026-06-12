import { z } from "zod";

/** Review (SRS) + gamification contracts (TRD §8). */

export const reviewGrade = z.enum(["again", "hard", "good", "easy"]);
export type ReviewGrade = z.infer<typeof reviewGrade>;

export const reviewCardView = z.object({
  id: z.string(),
  sourceKind: z.enum(["lesson", "problem", "visualization", "analysis"]),
  sourceId: z.string(),
  frontMdx: z.string(),
  backMdx: z.string(),
  easeFactor: z.number(),
  intervalDays: z.number().int().min(0),
  repetitions: z.number().int().min(0),
  dueAt: z.number(), // epoch ms
});
export type ReviewCardView = z.infer<typeof reviewCardView>;

/** GET /api/v1/reviews/due */
export const dueQueueResponse = z.object({
  due: z.array(reviewCardView),
  total: z.number().int().min(0),
});

/** POST /api/v1/reviews/:cardId/grade */
export const gradeRequest = z.object({
  grade: reviewGrade,
});
export type GradeRequest = z.infer<typeof gradeRequest>;

/** GET /api/v1/stats/me */
export const statsResponse = z.object({
  xpTotal: z.number().int().min(0),
  level: z.number().int().min(1),
  xpIntoLevel: z.number().int().min(0),
  xpForNextLevel: z.number().int().min(0),
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  streakFreezes: z.number().int().min(0),
  lessonsCompleted: z.number().int().min(0),
  problemsSolved: z.number().int().min(0),
  reviewsCompleted: z.number().int().min(0),
  dueCount: z.number().int().min(0),
});
export type StatsResponse = z.infer<typeof statsResponse>;

export const badgeView = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  earned: z.boolean(),
});
export type BadgeView = z.infer<typeof badgeView>;
