/**
 * Least-squares curve fitting over the TRD §5.2 candidate classes. Pure and deterministic —
 * heavily unit-tested; the timing/collection side lives in run.ts.
 */
export const CANDIDATE_CLASSES = [
  "O(1)",
  "O(log n)",
  "O(n)",
  "O(n log n)",
  "O(n²)",
  "O(n³)",
  "O(2ⁿ)",
] as const;

export type CandidateClass = (typeof CANDIDATE_CLASSES)[number];

export interface Sample {
  n: number;
  /** Measured cost: wall-clock ms or (preferred, noise-free) an operation count. */
  y: number;
}

export interface FitResult {
  bestFit: CandidateClass;
  runnerUp: CandidateClass;
  /** Coefficient of determination of the best fit (1 = perfect). */
  r2: number;
  /** Residual (SSE / SStot) per class, for the chart overlay & tooltips. */
  residuals: Record<CandidateClass, number>;
  /** Fitted scale constant per class: y ≈ c · g(n). */
  coefficients: Record<CandidateClass, number>;
}

/**
 * Basis value g(n) per class, normalized by g(nMax) to keep 2ⁿ finite for the n ranges the
 * exponential bail path produces (overflow would otherwise poison the comparison).
 */
export function basis(cls: CandidateClass, n: number, nMax: number): number {
  switch (cls) {
    case "O(1)":
      return 1;
    case "O(log n)":
      return Math.log2(n) / Math.log2(nMax);
    case "O(n)":
      return n / nMax;
    case "O(n log n)":
      return (n * Math.log2(n)) / (nMax * Math.log2(nMax));
    case "O(n²)":
      return (n / nMax) ** 2;
    case "O(n³)":
      return (n / nMax) ** 3;
    case "O(2ⁿ)":
      return Math.pow(2, n - nMax);
  }
}

/**
 * Fit y ≈ c·g(n) per candidate (closed-form least squares: c = Σgy / Σg²), rank by SSE.
 * Requires ≥ 3 samples spanning at least a 4× n range to say anything meaningful.
 */
export function fitSamples(samples: Sample[]): FitResult | { error: string } {
  const usable = samples.filter((s) => s.n >= 2 && Number.isFinite(s.y) && s.y >= 0);
  if (usable.length < 3) {
    return { error: "need at least 3 measurements to fit growth (run was cut short)" };
  }
  const ns = usable.map((s) => s.n);
  const nMax = Math.max(...ns);
  if (nMax / Math.min(...ns) < 4) {
    return { error: "measured n range too narrow to distinguish growth classes" };
  }

  const yMax = Math.max(...usable.map((s) => s.y), 1e-9);
  const ys = usable.map((s) => s.y / yMax);
  const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;
  const ssTot = ys.reduce((acc, y) => acc + (y - yMean) ** 2, 0) || 1e-12;

  const residuals = {} as Record<CandidateClass, number>;
  const coefficients = {} as Record<CandidateClass, number>;
  const sses = new Map<CandidateClass, number>();

  for (const cls of CANDIDATE_CLASSES) {
    const gs = usable.map((s) => basis(cls, s.n, nMax));
    let sgy = 0;
    let sgg = 0;
    for (let i = 0; i < gs.length; i++) {
      sgy += gs[i]! * ys[i]!;
      sgg += gs[i]! * gs[i]!;
    }
    const c = sgg === 0 ? 0 : Math.max(sgy / sgg, 0);
    let sse = 0;
    for (let i = 0; i < gs.length; i++) {
      sse += (ys[i]! - c * gs[i]!) ** 2;
    }
    sses.set(cls, sse);
    residuals[cls] = sse / ssTot;
    // De-normalize so callers can plot c·g(n) in original units.
    coefficients[cls] = c * yMax;
  }

  const ranked = [...sses.entries()].sort((a, b) => a[1] - b[1]);
  const bestFit = ranked[0]![0];
  const runnerUp = ranked[1]![0];
  const r2 = Math.max(0, 1 - ranked[0]![1] / ssTot);

  return { bestFit, runnerUp, r2, residuals, coefficients };
}
