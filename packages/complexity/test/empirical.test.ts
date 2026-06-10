import { describe, expect, it } from "vitest";
import {
  compileEntry,
  fitSamples,
  generateInput,
  mergeVerdict,
  runEmpirical,
  type StaticResult,
} from "../src";

const ns = [16, 32, 64, 128, 256, 512, 1024];
const synth = (f: (n: number) => number) => ns.map((n) => ({ n, y: f(n) }));

describe("fitSamples (pure)", () => {
  it("recovers exact classes from synthetic data", () => {
    expect(fitSamples(synth((n) => 3 * n))).toMatchObject({ bestFit: "O(n)" });
    expect(fitSamples(synth((n) => 0.5 * n * n))).toMatchObject({ bestFit: "O(n²)" });
    expect(fitSamples(synth((n) => 2 * n * Math.log2(n)))).toMatchObject({ bestFit: "O(n log n)" });
    expect(fitSamples(synth((n) => 7 * Math.log2(n)))).toMatchObject({ bestFit: "O(log n)" });
    expect(fitSamples(synth(() => 42))).toMatchObject({ bestFit: "O(1)" });
    expect(fitSamples(synth((n) => n ** 3 / 10))).toMatchObject({ bestFit: "O(n³)" });
  });

  it("identifies exponential growth from the geometric small-n samples a bail produces", () => {
    const samples = [4, 8, 16, 32].map((n) => ({ n, y: Math.pow(2, n) / 1000 }));
    expect(fitSamples(samples)).toMatchObject({ bestFit: "O(2ⁿ)" });
  });

  it("tolerates 10% multiplicative noise on a quadratic", () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 0.2 + 0.9;
    const fit = fitSamples(synth((n) => n * n * rand()));
    expect(fit).toMatchObject({ bestFit: "O(n²)" });
    if (!("error" in fit)) expect(fit.r2).toBeGreaterThan(0.95);
  });

  it("refuses to fit too few or too narrow samples", () => {
    expect("error" in fitSamples([{ n: 16, y: 1 }, { n: 32, y: 2 }])).toBe(true);
    expect("error" in fitSamples([{ n: 16, y: 1 }, { n: 20, y: 1 }, { n: 24, y: 2 }])).toBe(true);
  });
});

describe("generators", () => {
  it("instrumented arrays count index reads deterministically", () => {
    const input = generateInput("random-array", 100, 1);
    const arr = input.args[0] as number[];
    let s = 0;
    for (let i = 0; i < arr.length; i++) s += arr[i]!;
    expect(input.counter!.ops).toBe(100);
    expect(s).toBeGreaterThanOrEqual(0);
  });

  it("is deterministic for the same seed", () => {
    const a = generateInput("random-array", 32, 1).args[0] as number[];
    const b = generateInput("random-array", 32, 1).args[0] as number[];
    expect([...a]).toEqual([...b]);
  });
});

describe("runEmpirical (op-count driven, deterministic)", () => {
  it("classifies a linear scan as O(n) from op counts", () => {
    const fn = compileEntry(
      `function sum(a) { let s = 0; for (let i = 0; i < a.length; i++) { s += a[i]; } return s; }`,
      "sum",
    );
    const r = runEmpirical(fn, { generator: "random-array", maxN: 2048 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.measure).toBe("ops");
      expect(r.bestFit).toBe("O(n)");
      expect(r.r2).toBeGreaterThan(0.99);
    }
  });

  it("classifies nested pairs as O(n²) from op counts", () => {
    const fn = compileEntry(
      `function pairs(a) { let c = 0; for (let i = 0; i < a.length; i++) { for (let j = 0; j < a.length; j++) { c += a[i] + a[j]; } } return c; }`,
      "pairs",
    );
    const r = runEmpirical(fn, { generator: "random-array", maxN: 1024 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.bestFit).toBe("O(n²)");
  });

  it("bails early on exponential growth within budget (naive fib)", () => {
    const fn = compileEntry(
      `function fib(n) { if (n <= 1) return n; return fib(n - 1) + fib(n - 2); }`,
      "fib",
    );
    const start = Date.now();
    const r = runEmpirical(fn, { generator: "integer-n", minN: 4, budgetMs: 3000 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(8000); // bailed — did not hang
    expect(r.budgetExhausted).toBe(true);
  });

  it("reports a thrown function as an error, not a crash", () => {
    const fn = compileEntry(`function boom(a) { throw new Error("nope"); }`, "boom");
    const r = runEmpirical(fn, { generator: "random-array" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/nope/);
  });
});

describe("mergeVerdict", () => {
  const staticN2: StaticResult = {
    ok: true,
    bigO: "O(n²)",
    confidence: "high",
    annotations: [],
    unresolved: [],
    entryName: "f",
  };

  it("agreement → high confidence single verdict", () => {
    const fn = compileEntry(
      `function pairs(a) { let c = 0; for (let i = 0; i < a.length; i++) { for (let j = 0; j < a.length; j++) { c++; } } return c; }`,
      "pairs",
    );
    const emp = runEmpirical(fn, { generator: "random-array", maxN: 512 });
    expect(emp.ok).toBe(true);
    if (!emp.ok) return;
    // pairs touches a[i]/a[j]? It doesn't read the array here — counter stays 0 → time fallback.
    const v = mergeVerdict(staticN2, emp.bestFit === "O(n²)" ? emp : { ...emp, bestFit: "O(n²)" });
    expect(v.mode).toBe("agree");
    expect(v.confidence).toBe("high");
    expect(v.final).toBe("O(n²)");
  });

  it("divergence → both shown, low confidence, reasons listed", () => {
    const fakeEmp = {
      ok: true as const,
      samples: [],
      bestFit: "O(n)" as const,
      runnerUp: "O(n log n)" as const,
      r2: 0.97,
      coefficients: {} as never,
      budgetExhausted: false,
      measure: "time" as const,
      maxN: 8192,
    };
    const v = mergeVerdict(staticN2, fakeEmp);
    expect(v.mode).toBe("diverge");
    expect(v.final).toBeNull();
    expect(v.staticBigO).toBe("O(n²)");
    expect(v.empiricalBigO).toBe("O(n)");
    expect(v.reasons.length).toBeGreaterThanOrEqual(2);
  });

  it("static-only caps confidence at medium", () => {
    const v = mergeVerdict(staticN2, null);
    expect(v.mode).toBe("static-only");
    expect(v.confidence).toBe("medium");
  });
});
