import { z } from "zod";
import { difficulty, submissionStatus } from "./common";

/** Practice contracts (TRD §8), LeetCode "implement a function" style. */

/** The five editor languages. JS/TS are judged locally; the rest need the Judge0 host (TRD §7). */
export const practiceLanguage = z.enum(["javascript", "typescript", "python", "cpp", "java"]);
export type PracticeLanguage = z.infer<typeof practiceLanguage>;

export const compareMode = z.enum(["exact", "unordered"]);

/** Structured, language-agnostic test case: positional args + expected return value. */
export const sampleCase = z.object({
  args: z.array(z.unknown()),
  expected: z.unknown(),
});
export type SampleCase = z.infer<typeof sampleCase>;

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
  functionName: z.string(),
  signature: z.string(),
  compare: compareMode,
  timeLimitMs: z.number().int(),
  /** Generated starter stub per language. */
  starterCode: z.record(practiceLanguage, z.string()),
  /** PUBLIC sample cases only — the schema has no field for hidden cases (rule 6). */
  samples: z.array(sampleCase),
  hiddenCaseCount: z.number().int().min(0),
});
export type ProblemDetail = z.infer<typeof problemDetail>;

/** POST /api/v1/submissions — idempotency key prevents double submits (TRD §7). */
export const submissionCreate = z.object({
  problemSlug: z.string().min(1),
  language: practiceLanguage.default("javascript"),
  sourceCode: z.string().min(1).max(64_000),
  idempotencyKey: z.string().min(8).max(128),
});
export type SubmissionCreate = z.infer<typeof submissionCreate>;

export const caseResultPublic = z.object({
  index: z.number().int().min(0),
  isSample: z.boolean(),
  status: submissionStatus,
  runtimeMs: z.number().nullable(),
  /** Returned value / error excerpt — only for SAMPLE cases; hidden cases are verdict-only. */
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

export const submissionEvent = z.discriminatedUnion("type", [
  z.object({ type: z.literal("snapshot"), submission: submissionView }),
  z.object({ type: z.literal("case"), result: caseResultPublic }),
  z.object({ type: z.literal("done"), submission: submissionView }),
]);
export type SubmissionEvent = z.infer<typeof submissionEvent>;
