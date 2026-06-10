import { describe, expect, it } from "vitest";
import {
  analyzeStatic,
  compare,
  EXP,
  LOG_N,
  max,
  mul,
  N,
  N2,
  N_LOG_N,
  ONE,
  toLabel,
} from "../src";

describe("complexity algebra", () => {
  it("multiplies nested costs", () => {
    expect(toLabel(mul(N, N))).toBe("O(n²)");
    expect(toLabel(mul(N, LOG_N))).toBe("O(n log n)");
    expect(toLabel(mul(N2, N))).toBe("O(n³)");
    expect(toLabel(mul(EXP, N2))).toBe("O(2ⁿ)");
    expect(toLabel(mul(N2, LOG_N))).toBe("O(n² log n)"); // beyond the 7 candidates — static may emit it
  });

  it("takes the max for sequential costs", () => {
    expect(max(N, N_LOG_N)).toEqual(N_LOG_N);
    expect(max(ONE, LOG_N)).toEqual(LOG_N);
    expect(compare(EXP, N2)).toBeGreaterThan(0);
  });
});

describe("honesty contract", () => {
  it("data-dependent while-loop → unresolved + lowered confidence, never a silent guess", () => {
    const r = analyzeStatic(`function collatz(n) {
      let c = 0;
      while (n !== 1) { n = n % 2 === 0 ? n / 2 : 3 * n + 1; c++; }
      return c;
    }`);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.unresolved.length).toBeGreaterThanOrEqual(1);
      expect(r.confidence).not.toBe("high");
      expect(r.unresolved.join(" ")).toMatch(/data-dependent/);
    }
  });

  it("unknown call costs are flagged, not guessed", () => {
    const r = analyzeStatic(`function go(a) { return mystery(a) + a[0]; }`);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.unresolved.some((u) => u.includes("mystery"))).toBe(true);
      expect(r.confidence).toBe("medium");
    }
  });

  it("unrecognized recursion patterns land in unresolved", () => {
    const r = analyzeStatic(`function weird(a, b) { if (a.length === 0) return b; return weird(shuffle(a), b); }`);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.unresolved.some((u) => u.includes("recursion"))).toBe(true);
      expect(r.confidence).toBe("low"); // unknown call + unknown recursion
    }
  });

  it("reports parse errors with a line instead of guessing", () => {
    const r = analyzeStatic(`function broken( { return 1; }`);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
  });

  it("rejects input with no function", () => {
    const r = analyzeStatic(`const x = 42;`);
    expect(r.ok).toBe(false);
  });
});

describe("annotations", () => {
  it("carries per-line notes with valid line numbers", () => {
    const code = `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return [];
}`;
    const r = analyzeStatic(code);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const lines = code.split("\n").length;
      for (const a of r.annotations) {
        expect(a.line).toBeGreaterThanOrEqual(1);
        expect(a.line).toBeLessThanOrEqual(lines);
      }
      expect(r.annotations.some((a) => a.line === 2)).toBe(true); // outer loop annotated
      expect(r.annotations.some((a) => a.line === 3)).toBe(true); // inner loop annotated
    }
  });

  it("helpers-first multi-function source resolves sibling call costs", () => {
    const r = analyzeStatic(`
      function scan(a) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s; }
      function main(a) {
        let total = 0;
        for (let i = 0; i < a.length; i++) { total += scan(a); }
        return total;
      }
    `);
    expect(r.ok && r.bigO).toBe("O(n²)");
    if (r.ok) expect(r.entryName).toBe("main");
  });
});
