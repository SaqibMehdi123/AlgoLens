/**
 * Layer 2 — empirical measurement (TRD §5.2): geometric n schedule, repetitions with median,
 * op-counting preferred / wall-time fallback, adaptive 10s budget whose early exhaustion is
 * itself a strong exponential signal.
 *
 * ⚠️ SECURITY (rule 5): `compileEntry` uses the Function constructor and therefore EXECUTES the
 * provided source. In the web app it must only ever run inside the dedicated bench Web Worker
 * (TRD §1) — never on the main thread, never in an API route. Unit tests call it with trusted
 * fixtures only.
 */
import { fitSamples, type CandidateClass, type FitResult } from "./fit";
import { generateInput, type GeneratorKey } from "./generators";

export interface EmpiricalSample {
  n: number;
  ms: number;
  ops: number | null;
}

export interface EmpiricalResult {
  ok: true;
  samples: EmpiricalSample[];
  bestFit: CandidateClass;
  runnerUp: CandidateClass;
  r2: number;
  coefficients: Record<CandidateClass, number>;
  /** True when the run stopped before the full schedule — strong exponential signal at small n. */
  budgetExhausted: boolean;
  /** Whether op counts (noise-free) or wall time (noisy) were fitted. */
  measure: "ops" | "time";
  maxN: number;
}

export interface EmpiricalError {
  ok: false;
  error: string;
  samples: EmpiricalSample[];
  budgetExhausted: boolean;
}

export interface RunOptions {
  generator: GeneratorKey;
  /** Geometric schedule bounds (powers of two). */
  minN?: number;
  maxN?: number;
  /** Total wall-clock budget (default 10s per TRD §5.2). */
  budgetMs?: number;
  /** Hard cap for one invocation before the schedule stops escalating. */
  singleRunCapMs?: number;
  repetitions?: number;
  now?: () => number;
  /** Streaming hook for UI progress (one call per completed n). */
  onSample?: (sample: EmpiricalSample) => void;
}

type AnyFn = (...args: unknown[]) => unknown;

/** Compile user source and return the named entry function. Worker/test use only — see header. */
export function compileEntry(source: string, entryName: string): AnyFn {
  const factory = new Function(
    `"use strict";\n${source}\n;if (typeof ${entryName} !== "function") { throw new Error(${JSON.stringify(
      `"${entryName}" is not a function`,
    )}); }\nreturn ${entryName};`,
  );
  return factory() as AnyFn;
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

export function runEmpirical(fn: AnyFn, options: RunOptions): EmpiricalResult | EmpiricalError {
  const {
    generator,
    minN = 16,
    maxN = 8192,
    budgetMs = 10_000,
    singleRunCapMs = 1_500,
    repetitions = 3,
    now = () => performance.now(),
    onSample,
  } = options;

  const samples: EmpiricalSample[] = [];
  const start = now();
  let budgetExhausted = false;

  let prevMs: number | null = null;
  for (let n = minN; n <= maxN; n *= 2) {
    const msRuns: number[] = [];
    const opRuns: number[] = [];
    try {
      for (let rep = 0; rep < repetitions; rep++) {
        const input = generateInput(generator, n, rep + 1);
        const t0 = now();
        fn(...input.args);
        const elapsed = now() - t0;
        msRuns.push(elapsed);
        if (input.counter) opRuns.push(input.counter.ops);
        if (elapsed > singleRunCapMs) break; // do not keep re-running something this slow
      }
    } catch (e) {
      return {
        ok: false,
        error: `function threw at n=${n}: ${(e as Error).message}`,
        samples,
        budgetExhausted,
      };
    }

    const ms = median(msRuns);
    const ops = opRuns.length > 0 ? median(opRuns) : null;
    const sample: EmpiricalSample = { n, ms, ops };
    samples.push(sample);
    onSample?.(sample);

    const elapsedTotal = now() - start;
    if (ms > singleRunCapMs) {
      budgetExhausted = n < maxN;
      break;
    }
    // Project the next size by continuing the last growth ratio; stop if it would blow the
    // budget. For exponential growth the ratio itself explodes — this bails after ~ms-scale runs.
    if (prevMs !== null && prevMs > 0) {
      const ratio = Math.max(ms / prevMs, 1);
      const projected = ms * ratio;
      if (elapsedTotal + projected > budgetMs) {
        budgetExhausted = n < maxN;
        break;
      }
    }
    if (elapsedTotal > budgetMs) {
      budgetExhausted = n < maxN;
      break;
    }
    prevMs = ms;
  }

  // Prefer op counts when the function actually touched the instrumented input.
  const opsUsable =
    samples.length >= 3 && samples.every((s) => s.ops !== null) && samples.at(-1)!.ops! > 0;
  const fitInput = samples.map((s) => ({ n: s.n, y: opsUsable ? s.ops! : Math.max(s.ms, 1e-4) }));
  const fit: FitResult | { error: string } = fitSamples(fitInput);
  if ("error" in fit) {
    return { ok: false, error: fit.error, samples, budgetExhausted };
  }

  return {
    ok: true,
    samples,
    bestFit: fit.bestFit,
    runnerUp: fit.runnerUp,
    r2: fit.r2,
    coefficients: fit.coefficients,
    budgetExhausted,
    measure: opsUsable ? "ops" : "time",
    maxN: samples.at(-1)?.n ?? 0,
  };
}
