import { z } from "zod";
import { codeLanguage } from "./common";

/** Complexity Lab contracts (TRD §8: POST /api/v1/analyses, GET /api/v1/analyses/:id). */

export const generatorKey = z.enum([
  "random-array",
  "sorted-array",
  "reversed-array",
  "random-string",
  "integer-n",
]);

export const confidenceLevel = z.enum(["low", "medium", "high"]);

export const staticResultSchema = z.object({
  bigO: z.string(),
  confidence: confidenceLevel,
  annotations: z.array(z.object({ line: z.number().int().min(1), note: z.string() })),
  unresolved: z.array(z.string()),
});

export const empiricalResultSchema = z.object({
  bestFit: z.string(),
  runnerUp: z.string(),
  r2: z.number().min(0).max(1),
  samples: z.array(
    z.object({ n: z.number().int().positive(), ms: z.number(), ops: z.number().nullable() }),
  ),
  budgetExhausted: z.boolean(),
  measure: z.enum(["ops", "time"]),
});

/** POST /api/v1/analyses — persists a finished client-side analysis (save/share). */
export const analysisCreate = z.object({
  language: codeLanguage.default("javascript"),
  sourceCode: z.string().min(1).max(20_000),
  generatorKey,
  staticResult: staticResultSchema.nullable(),
  empiricalResult: empiricalResultSchema.nullable(),
  finalEstimate: z.string().nullable(),
  confidence: confidenceLevel,
  isPublic: z.boolean().default(false),
});
export type AnalysisCreate = z.infer<typeof analysisCreate>;
