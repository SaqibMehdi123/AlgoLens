import { z } from "zod";

/** Shared enums, mirrored 1:1 from the PostgreSQL enums in docs/03 §0. */
export const difficulty = z.enum(["intro", "easy", "medium", "hard"]);
export const codeLanguage = z.enum(["javascript", "typescript", "python"]);
export const contentStatus = z.enum(["draft", "review", "published", "archived"]);
export const submissionStatus = z.enum([
  "queued",
  "running",
  "accepted",
  "wrong_answer",
  "time_limit",
  "memory_limit",
  "runtime_error",
  "compile_error",
  "judge_error",
]);

export type Difficulty = z.infer<typeof difficulty>;
export type CodeLanguage = z.infer<typeof codeLanguage>;
export type SubmissionStatus = z.infer<typeof submissionStatus>;

/**
 * RFC 7807 `application/problem+json` — the single error shape every API route returns (TRD §8).
 */
export const problemJson = z.object({
  type: z.string().default("about:blank"),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});
export type ProblemJson = z.infer<typeof problemJson>;

export function problem(status: number, title: string, detail?: string): ProblemJson {
  return { type: "about:blank", title, status, ...(detail ? { detail } : {}) };
}

/** Cursor pagination envelope (TRD §8 conventions). */
export const cursorQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type CursorQuery = z.infer<typeof cursorQuery>;

export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({ items: z.array(item), nextCursor: z.string().nullable() });
}
