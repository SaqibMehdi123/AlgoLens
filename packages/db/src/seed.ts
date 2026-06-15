/**
 * Seed the `visualizations` catalog from the algo-core registry — the single source of truth for
 * which algorithms exist. Idempotent: re-running upserts by slug. Run with `pnpm db:seed`.
 */
import { registry } from "@algolens/algo-core";
import { createDb } from "./client";
import { visualizations, type NewVisualization } from "./schema";

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
  // eslint-disable-next-line no-console
  console.log(`Seeded ${rows.length} visualizations.`);
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
