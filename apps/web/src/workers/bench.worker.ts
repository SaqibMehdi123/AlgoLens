/// <reference lib="webworker" />
/**
 * The bench worker (TRD §1 "bench-worker"). This is the ONLY place user code executes on the
 * client (rule 5): static analysis (parse-only) and the empirical run (Function constructor)
 * both happen here, keeping the main thread free — the page must stay scrollable during a run.
 *
 * Protocol: in {type:"run", code, generator} →
 * out {type:"static"} → {type:"sample"}* → {type:"done"} | {type:"error"}.
 */
import {
  analyzeStatic,
  compileEntry,
  runEmpirical,
  type EmpiricalResult,
  type EmpiricalSample,
  type GeneratorKey,
  type StaticParseError,
  type StaticResult,
} from "@algolens/complexity";

export interface RunRequest {
  type: "run";
  code: string;
  generator: GeneratorKey;
}

export type BenchMessage =
  | { type: "static"; result: StaticResult | StaticParseError }
  | { type: "sample"; sample: EmpiricalSample }
  | { type: "done"; result: EmpiricalResult | { ok: false; error: string } }
  | { type: "error"; error: string };

const post = (msg: BenchMessage) => self.postMessage(msg);

self.onmessage = (event: MessageEvent<RunRequest>) => {
  const { code, generator } = event.data;
  try {
    const staticResult = analyzeStatic(code);
    post({ type: "static", result: staticResult });

    const entryName = staticResult.ok ? staticResult.entryName : guessEntryName(code);
    if (!entryName) {
      post({ type: "done", result: { ok: false, error: "no function found to execute" } });
      return;
    }

    const fn = compileEntry(code, entryName);
    const result = runEmpirical(fn, {
      generator,
      // integer-n must start small: exponential functions explode immediately.
      minN: generator === "integer-n" ? 4 : 16,
      onSample: (sample) => post({ type: "sample", sample }),
    });
    post({ type: "done", result: result.ok ? result : { ok: false, error: result.error } });
  } catch (e) {
    post({ type: "error", error: (e as Error).message });
  }
};

function guessEntryName(code: string): string | null {
  const m = /function\s+([A-Za-z_$][\w$]*)/.exec(code) ?? /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/.exec(code);
  return m?.[1] ?? null;
}
