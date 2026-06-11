import { z } from "zod";
import { codeLanguage, difficulty, submissionStatus } from "./common";

/** Practice contracts (TRD §8). Problem detail STRUCTURALLY cannot carry hidden cases (rule 6). */

export const sampleCase = z.object({
  input: z.string(),
  expected: z.string(),
});

export const problemSummary = z.object({
  slug: z.string(),
  title: z.string(),
  difficulty,
  tags: z.array(z.string()),
  lessonSlug: z.string().nullable(),
});
export type ProblemSummary = z.infer<typeof problemSummary>;

export const problemDetail = problemSummary.extend({
  statementMd: z.string(),
  starterCode: z.string(),
  timeLimitMs: z.number().int(),
  /** PUBLIC sample cases only — the schema has no field for hidden cases by design. */
  samples: z.array(sampleCase),
  hiddenCaseCount: z.number().int().min(0),
});
export type ProblemDetail = z.infer<typeof problemDetail>;

/** POST /api/v1/submissions — idempotency key prevents double submits (TRD §7). */
export const submissionCreate = z.object({
  problemSlug: z.string().min(1),
  language: codeLanguage.default("javascript"),
  sourceCode: z.string().min(1).max(64_000),
  idempotencyKey: z.string().min(8).max(128),
});
export type SubmissionCreate = z.infer<typeof submissionCreate>;

export const caseResultPublic = z.object({
  index: z.number().int().min(0),
  isSample: z.boolean(),
  status: submissionStatus,
  runtimeMs: z.number().nullable(),
  /** Excerpts only for SAMPLE cases — hidden-case output is redacted to verdict-only. */
  stdoutExcerpt: z.string().nullable(),
  stderrExcerpt: z.string().nullable(),
});
export type CaseResultPublic = z.infer<typeof caseResultPublic>;

export const submissionView = z.object({
  id: z.string(),
  problemSlug: z.string(),
  status: submissionStatus,
  passedCount: z.number().int(),
  totalCount: z.number().int(),
  runtimeMs: z.number().nullable(),
  cases: z.array(caseResultPublic),
  createdAt: z.string(),
});
export type SubmissionView = z.infer<typeof submissionView>;

/** SSE event payloads on /api/v1/submissions/:id/events. */
export const submissionEvent = z.discriminatedUnion("type", [
  z.object({ type: z.literal("snapshot"), submission: submissionView }),
  z.object({ type: z.literal("case"), result: caseResultPublic }),
  z.object({ type: z.literal("done"), submission: submissionView }),
]);
export type SubmissionEvent = z.infer<typeof submissionEvent>;
