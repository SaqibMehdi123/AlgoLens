import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registryByKey } from "@algolens/algo-core";
import { describe, expect, it } from "vitest";
import { flattenLessons, locateLesson, tracks } from "../src";

const LESSONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "lessons");

const allLessons = tracks.flatMap((t) => flattenLessons(t));

describe("curriculum manifest", () => {
  it("has globally unique lesson slugs and per-track unique module slugs", () => {
    const slugs = allLessons.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const track of tracks) {
      const moduleSlugs = track.modules.map((m) => m.slug);
      expect(new Set(moduleSlugs).size).toBe(moduleSlugs.length);
    }
  });

  it("references only prerequisites that exist and never itself", () => {
    const known = new Set(allLessons.map((l) => l.slug));
    for (const lesson of allLessons) {
      for (const prereq of lesson.prerequisites) {
        expect(known.has(prereq), `${lesson.slug} prereq ${prereq}`).toBe(true);
        expect(prereq).not.toBe(lesson.slug);
      }
    }
  });

  it("locateLesson resolves every lesson with correct next-pointers", () => {
    for (const track of tracks) {
      const ordered = flattenLessons(track);
      for (let i = 0; i < ordered.length; i++) {
        const loc = locateLesson(track.slug, ordered[i]!.slug);
        expect(loc).toBeDefined();
        expect(loc!.next?.slug ?? null).toBe(ordered[i + 1]?.slug ?? null);
      }
    }
  });
});

describe.each(allLessons.map((l) => [l.slug, l] as const))("lesson %s", (_slug, lesson) => {
  const file = path.join(LESSONS_DIR, lesson.file);

  it("has an MDX file on disk", () => {
    expect(existsSync(file), `${lesson.file} missing`).toBe(true);
  });

  const source = existsSync(file) ? readFileSync(file, "utf8") : "";

  it("declares the exact number of <Quiz/> blocks present in the MDX", () => {
    const count = (source.match(/<Quiz\s/g) ?? []).length;
    expect(count).toBe(lesson.quizCount);
  });

  it("follows the exemplar template: at least one <Viz/>, a complexity table, both quiz types", () => {
    expect(source).toMatch(/<Viz\s/);
    expect(source).toMatch(/\|\s*(Class|Case|Aspect)\s*\|/); // complexity table
    expect(source).toMatch(/type="complexity_pick"/);
    expect(source).toMatch(/type="predict_output"/);
  });

  it("references only registered algorithms in <Viz/> and replay links", () => {
    for (const match of source.matchAll(/algo[=:]\s*"([a-z0-9-]+)"/g)) {
      expect(registryByKey.has(match[1]!), `unknown algo "${match[1]}"`).toBe(true);
    }
  });

  it("contains no raw HTML script/iframe/embed (MDX sanitization rule)", () => {
    expect(source).not.toMatch(/<(script|iframe|embed|object|style)[\s>]/i);
  });

  it("stays under the 1200-word budget", () => {
    const words = source
      .replace(/<Quiz[\s\S]*?\/>/g, " ") // quiz props aren't prose
      .split(/\s+/)
      .filter(Boolean).length;
    expect(words).toBeLessThan(1200);
  });
});
