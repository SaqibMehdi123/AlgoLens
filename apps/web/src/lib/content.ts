import "server-only";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { LessonMeta } from "@algolens/content";

/**
 * Resolve the repo-level content/ directory (TRD §3: content lives at the monorepo root).
 * cwd is apps/web under `next dev/build`, and the repo root under vitest/turbo — try both.
 */
function contentDir(): string {
  const candidates = [
    path.join(process.cwd(), "..", "..", "content"),
    path.join(process.cwd(), "content"),
  ];
  for (const dir of candidates) {
    if (existsSync(path.join(dir, "lessons"))) return dir;
  }
  throw new Error("content/ directory not found from " + process.cwd());
}

export function readLessonSource(lesson: LessonMeta): string {
  // file comes from the typed manifest (not user input); basename() hard-blocks traversal anyway.
  const file = path.join(contentDir(), "lessons", path.basename(lesson.file));
  return readFileSync(file, "utf8");
}
