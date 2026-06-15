import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read .env itself. Load the repo-root one (cwd is packages/db when run via
// `pnpm --filter @algolens/db db:*`). No-op in CI/deploy where real env vars are injected.
try {
  process.loadEnvFile(resolve(process.cwd(), "../../.env"));
} catch {
  /* no .env file — fall back to the ambient environment */
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/algolens" },
  strict: true,
  verbose: true,
});
