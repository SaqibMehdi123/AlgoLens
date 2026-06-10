/**
 * Recorder — drains a generator into a {@link Trace} with hard caps (TRD §4.2).
 *
 * Caps bound animation memory and define each algorithm's max input size. The recorder clones the
 * input twice: once to snapshot the initial view, once as the generator's private working copy —
 * so generators may mutate in place (TRD §4.1 style) without corrupting the recorded view or the
 * caller's data.
 */
import type { AlgorithmSpec } from "../types";
import type { Json, Step, StepType, Trace } from "./step";

export interface RecordOptions {
  /** Stop after this many steps (default 20,000 per TRD §4.2). */
  maxSteps?: number;
  /** Stop if recording exceeds this wall-clock budget in ms (default 200 per TRD §4.2). */
  budgetMs?: number;
}

const DEFAULT_MAX_STEPS = 20_000;
const DEFAULT_BUDGET_MS = 200;

/** Structured-clone with a JSON fallback so algo-core stays dependency- and environment-free. */
function clone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function recordTrace<I>(
  spec: AlgorithmSpec<I>,
  input: I,
  options: RecordOptions = {},
): Trace {
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
  const budgetMs = options.budgetMs ?? DEFAULT_BUDGET_MS;

  const view = spec.buildView(clone(input));
  const steps: Step[] = [];
  const counts: Partial<Record<StepType, number>> = {};
  const start = now();
  let capped = false;

  for (const step of spec.run(clone(input))) {
    steps.push(step);
    counts[step.t] = (counts[step.t] ?? 0) + 1;
    if (steps.length >= maxSteps) {
      capped = true;
      break;
    }
    // Time check is sampled (not every step) to keep the hot loop cheap.
    if ((steps.length & 0xff) === 0 && now() - start > budgetMs) {
      capped = true;
      break;
    }
  }

  return {
    algo: spec.key,
    // Inputs are plain serializable data; the cast records them as Json for share URLs / workers.
    input: input as Json,
    view,
    steps,
    pseudocode: spec.pseudocode,
    meta: { counts, capped, stepCount: steps.length },
  };
}

/**
 * Invariant check used by the golden-trace tests: every step's `line` must be a valid 1-based
 * index into `pseudocode`. TRD §4.2 requires this — pseudocode sync is structural, not coincidental.
 */
export function assertValidLines(trace: Trace): void {
  const max = trace.pseudocode.length;
  for (let i = 0; i < trace.steps.length; i++) {
    const line = trace.steps[i]!.line;
    if (!Number.isInteger(line) || line < 1 || line > max) {
      throw new Error(
        `Trace "${trace.algo}" step ${i} (${trace.steps[i]!.t}) has invalid line ${line}; ` +
          `pseudocode has ${max} lines.`,
      );
    }
  }
}
