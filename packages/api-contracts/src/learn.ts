import { z } from "zod";
import { difficulty } from "./common";

/** Learn-pillar contracts (TRD §8: tracks, lessons, progress PUT, quiz-attempts POST). */

export const lessonSummary = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  estMinutes: z.number().int().positive(),
  difficulty,
  position: z.number().int(),
  quizCount: z.number().int().min(0),
  prerequisites: z.array(z.string()),
  practiceSlug: z.string().nullable(),
});
export type LessonSummary = z.infer<typeof lessonSummary>;

export const moduleSummary = z.object({
  slug: z.string(),
  title: z.string(),
  position: z.number().int(),
  lessons: z.array(lessonSummary),
});

export const trackSummary = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  level: difficulty,
  position: z.number().int(),
  lessonCount: z.number().int().min(0),
  modules: z.array(moduleSummary),
});
export type TrackSummary = z.infer<typeof trackSummary>;

export const tracksResponse = z.object({ tracks: z.array(trackSummary) });
export type TracksResponse = z.infer<typeof tracksResponse>;

/** GET /api/v1/lessons/:slug — metadata + raw MDX (content-in-repo v1). */
export const lessonDetail = lessonSummary.extend({
  trackSlug: z.string(),
  moduleSlug: z.string(),
  contentMdx: z.string(),
});
export type LessonDetail = z.infer<typeof lessonDetail>;

/** PUT /api/v1/progress/lessons/:slug */
export const progressPut = z.object({
  status: z.enum(["in_progress", "completed"]),
  scrollPct: z.number().int().min(0).max(100),
});
export type ProgressPut = z.infer<typeof progressPut>;

/**
 * POST /api/v1/quiz-attempts. Content-in-repo quizzes are addressed by (lessonSlug, quizId)
 * rather than a DB question UUID; the server maps them when the CMS lands (docs/03 note 5).
 */
export const quizAttemptCreate = z.object({
  lessonSlug: z.string().min(1),
  quizId: z.string().min(1),
  response: z.union([z.number().int(), z.array(z.number().int())]),
  isCorrect: z.boolean(),
});
export type QuizAttemptCreate = z.infer<typeof quizAttemptCreate>;
