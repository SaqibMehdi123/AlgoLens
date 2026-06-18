/**
 * Seed the `visualizations` catalog from the algo-core registry — the single source of truth for
 * which algorithms exist. Idempotent: re-running upserts by slug. Run with `pnpm db:seed`.
 */
import { registry } from "@algolens/algo-core";
import { tracks as curriculum } from "@algolens/content";
import type { Database } from "./client";
import { createDb } from "./client";
import {
  lessonPrerequisites,
  lessons,
  modules,
  tracks,
  visualizations,
  type NewVisualization,
} from "./schema";

function defaultConfigFor(layout: string): Record<string, unknown> {
  if (layout === "graph") return { input: { type: "graph", start: "A" }, speed: 1 };
  if (layout === "tree")
    return { input: { type: "values", values: [8, 3, 10, 1, 6, 14, 4, 7, 13] }, speed: 1 };
  return { input: { type: "array", n: 12, order: "random" }, speed: 1 };
}

export function buildSeedRows(): NewVisualization[] {
  return registry.map((entry, i) => ({
    slug: entry.key,
    title: entry.title,
    category: entry.category,
    algoKey: entry.key,
    pseudocode: entry.pseudocode,
    complexity: entry.complexity,
    defaultConfig: defaultConfigFor(entry.layout),
    maxInputSize: entry.maxInputSize,
    status: "published",
    position: i,
  }));
}

/**
 * Seed tracks / modules / lessons / prerequisites from the content manifest (the source of truth).
 * Idempotent: upserts by natural key. user_lesson_progress FKs to lessons.id, so this must run
 * before durable progress persistence works.
 */
async function seedCurriculum(
  db: Database,
): Promise<{ tracks: number; modules: number; lessons: number }> {
  const counts = { tracks: 0, modules: 0, lessons: 0 };
  const lessonIdBySlug = new Map<string, string>();
  const prereqPairs: { lessonSlug: string; prereqSlug: string }[] = [];

  for (const track of curriculum) {
    const [trackRow] = await db
      .insert(tracks)
      .values({
        slug: track.slug,
        title: track.title,
        description: track.description ?? null,
        level: track.level,
        position: track.position,
        status: "published",
      })
      .onConflictDoUpdate({
        target: tracks.slug,
        set: {
          title: track.title,
          description: track.description ?? null,
          level: track.level,
          position: track.position,
          status: "published",
        },
      })
      .returning({ id: tracks.id });
    counts.tracks++;
    const trackId = trackRow!.id;

    for (const mod of track.modules) {
      const [modRow] = await db
        .insert(modules)
        .values({ trackId, slug: mod.slug, title: mod.title, position: mod.position })
        .onConflictDoUpdate({
          target: [modules.trackId, modules.slug],
          set: { title: mod.title, position: mod.position },
        })
        .returning({ id: modules.id });
      counts.modules++;
      const moduleId = modRow!.id;

      for (const lesson of mod.lessons) {
        const [lessonRow] = await db
          .insert(lessons)
          .values({
            moduleId,
            slug: lesson.slug,
            title: lesson.title,
            summary: lesson.summary ?? null,
            contentPath: lesson.file,
            estMinutes: lesson.estMinutes,
            difficulty: lesson.difficulty,
            position: lesson.position,
            status: "published",
            publishedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: lessons.slug,
            set: {
              moduleId,
              title: lesson.title,
              summary: lesson.summary ?? null,
              contentPath: lesson.file,
              estMinutes: lesson.estMinutes,
              difficulty: lesson.difficulty,
              position: lesson.position,
              status: "published",
            },
          })
          .returning({ id: lessons.id });
        counts.lessons++;
        lessonIdBySlug.set(lesson.slug, lessonRow!.id);
        for (const prereq of lesson.prerequisites) {
          prereqPairs.push({ lessonSlug: lesson.slug, prereqSlug: prereq });
        }
      }
    }
  }

  for (const { lessonSlug, prereqSlug } of prereqPairs) {
    const lessonId = lessonIdBySlug.get(lessonSlug);
    const prerequisiteId = lessonIdBySlug.get(prereqSlug);
    if (!lessonId || !prerequisiteId) continue;
    await db.insert(lessonPrerequisites).values({ lessonId, prerequisiteId }).onConflictDoNothing();
  }

  return counts;
}

async function main(): Promise<void> {
  // tsx does not read .env itself; load the repo-root one (cwd is packages/db under pnpm --filter).
  try {
    const { resolve } = await import("node:path");
    process.loadEnvFile(resolve(process.cwd(), "../../.env"));
  } catch {
    /* no .env file — fall back to the ambient environment */
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const db = createDb(url);
  const rows = buildSeedRows();
  for (const row of rows) {
    await db
      .insert(visualizations)
      .values(row)
      .onConflictDoUpdate({
        target: visualizations.slug,
        set: {
          title: row.title,
          category: row.category,
          pseudocode: row.pseudocode,
          complexity: row.complexity,
          defaultConfig: row.defaultConfig,
          maxInputSize: row.maxInputSize,
          position: row.position,
          status: "published",
        },
      });
  }
  const c = await seedCurriculum(db);
  // eslint-disable-next-line no-console
  console.log(
    `Seeded ${rows.length} visualizations, ${c.tracks} track(s), ${c.modules} modules, ${c.lessons} lessons.`,
  );
}

// Only run when executed directly (not when imported by tests).
if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
      process.exit(1);
    });
}
