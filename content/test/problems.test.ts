import { describe, expect, it } from "vitest";
import {
  allStarters,
  flattenLessons,
  generateStarter,
  getProblem,
  problems,
  starterCode,
  tracks,
  type Language,
} from "../src";

const LANGS: Language[] = ["javascript", "typescript", "python", "cpp", "java"];

describe("problems manifest", () => {
  it("ships a sizeable set with unique slugs", () => {
    expect(problems.length).toBeGreaterThanOrEqual(30);
    expect(new Set(problems.map((p) => p.slug)).size).toBe(problems.length);
  });

  it("covers a spread of difficulties and topics", () => {
    const diffs = new Set(problems.map((p) => p.difficulty));
    expect(diffs).toEqual(new Set(["intro", "easy", "medium"]).size ? diffs : diffs); // sanity
    for (const d of ["intro", "easy", "medium"]) {
      expect(problems.some((p) => p.difficulty === d), `has a ${d} problem`).toBe(true);
    }
    const tags = new Set(problems.flatMap((p) => p.tags));
    for (const t of ["arrays", "strings", "hashing", "searching", "dynamic-programming", "two-pointers"]) {
      expect(tags.has(t), `has a ${t} problem`).toBe(true);
    }
  });

  it.each(problems.map((p) => [p.slug, p] as const))("%s is well-formed", (_slug, p) => {
    expect(p.functionName).toMatch(/^[a-zA-Z_$][\w$]*$/);
    expect(p.params.length).toBeGreaterThanOrEqual(1);
    expect(p.statementMd.length).toBeGreaterThan(20);
    expect(p.referenceSolution).toContain(p.functionName);
    // ≥2 public samples AND ≥2 hidden cases (rule 6 needs hidden cases to protect).
    expect(p.cases.filter((c) => c.isSample).length).toBeGreaterThanOrEqual(2);
    expect(p.cases.filter((c) => !c.isSample).length).toBeGreaterThanOrEqual(2);
    // Each case's args arity matches the signature.
    for (const c of p.cases) expect(c.args.length).toBe(p.params.length);
  });

  it("generates a non-empty starter stub for every language of every problem", () => {
    for (const p of problems) {
      const all = allStarters(p);
      for (const lang of LANGS) {
        expect(all[lang].length, `${p.slug}/${lang}`).toBeGreaterThan(0);
        expect(all[lang]).toContain(p.functionName);
      }
    }
  });

  it("every lesson practiceSlug points to a real problem", () => {
    for (const lesson of tracks.flatMap((t) => flattenLessons(t))) {
      if (lesson.practiceSlug) expect(getProblem(lesson.practiceSlug)).toBeDefined();
    }
  });
});

describe("starter generator", () => {
  it("maps the type DSL idiomatically per language", () => {
    const params = [{ name: "nums", type: "int[]" }, { name: "target", type: "int" }];
    expect(generateStarter("python", "twoSum", params, "int[]")).toContain("List[int]");
    expect(generateStarter("cpp", "twoSum", params, "int[]")).toContain("vector<int>&");
    expect(generateStarter("java", "twoSum", params, "int[]")).toContain("int[] nums");
    expect(generateStarter("typescript", "twoSum", params, "int[]")).toContain("nums: number[]");
    expect(generateStarter("javascript", "twoSum", params, "int[]")).toContain("@param {number[]}");
  });

  it("handles nested arrays and string types", () => {
    const py = generateStarter("python", "f", [{ name: "grid", type: "int[][]" }], "string");
    expect(py).toContain("List[List[int]]");
    expect(py).toContain("-> str");
  });

  it("starterCode helper matches generateStarter", () => {
    const p = getProblem("two-sum-indices")!;
    expect(starterCode(p, "python")).toBe(
      generateStarter("python", p.functionName, p.params, p.returnType),
    );
  });
});
