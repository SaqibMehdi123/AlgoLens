import { z } from "zod";

/** Input configuration for a visualization run (validated at the boundary — TRD rule 4). */
export const arrayOrder = z.enum(["random", "sorted", "reversed", "nearly-sorted", "few-unique"]);
export type ArrayOrder = z.infer<typeof arrayOrder>;

export const vizInputConfig = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("array"),
    n: z.number().int().min(1).max(200),
    order: arrayOrder.default("random"),
    values: z.array(z.number()).max(200).optional(),
    target: z.number().optional(),
    seed: z.number().int().optional(),
  }),
  z.object({
    type: z.literal("graph"),
    start: z.string(),
  }),
  z.object({
    type: z.literal("values"),
    values: z.array(z.number()).max(64),
    target: z.number().optional(),
  }),
]);
export type VizInputConfig = z.infer<typeof vizInputConfig>;

export const vizConfig = z.object({
  input: vizInputConfig,
  speed: z.number().min(0.25).max(4).default(1),
});
export type VizConfig = z.infer<typeof vizConfig>;

export const visualizationSummary = z.object({
  slug: z.string(),
  title: z.string(),
  category: z.string(),
  complexity: z.object({
    best: z.string(),
    average: z.string(),
    worst: z.string(),
    space: z.string(),
  }),
  maxInputSize: z.number().int(),
});
export type VisualizationSummary = z.infer<typeof visualizationSummary>;

/** POST /api/v1/snapshots — create a shareable player state (A6). */
export const snapshotCreate = z.object({
  visualizationSlug: z.string().min(1),
  config: vizConfig,
  frameIndex: z.number().int().min(0).default(0),
  title: z.string().max(120).optional(),
});
export type SnapshotCreate = z.infer<typeof snapshotCreate>;
