import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDb>;

/** Create a Drizzle client bound to a Postgres connection string. */
export function createDb(url: string) {
  const client = postgres(url, { prepare: false });
  return drizzle(client, { schema });
}

let cached: Database | null = null;

/** Lazily resolve the app-wide client from `DATABASE_URL` (throws only when actually used). */
export function db(): Database {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  cached = createDb(url);
  return cached;
}
