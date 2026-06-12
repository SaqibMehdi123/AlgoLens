/// <reference lib="webworker" />
/**
 * exec-worker (TRD §1): client-side SAMPLE runs for the function harness. User code executes here
 * — never on the page thread (rule 5). The page enforces a 5s wall-clock kill by terminating this
 * worker. The function is defined once, then called per sample; the returned value is JSON-
 * normalised (matching the server judge) before being posted back for comparison.
 */
export interface ExecRequest {
  type: "exec";
  code: string;
  functionName: string;
  argsList: unknown[][];
}

export interface ExecCaseResult {
  value: unknown;
  error: string | null;
  ms: number;
}

export type ExecResponse =
  | { type: "case"; index: number; result: ExecCaseResult }
  | { type: "done" };

self.onmessage = (event: MessageEvent<ExecRequest>) => {
  const { code, functionName, argsList } = event.data;

  let fn: ((...args: unknown[]) => unknown) | null = null;
  let defError: string | null = null;
  try {
    const factory = new Function(
      `"use strict";\n${code}\n;return (typeof ${functionName} === "function") ? ${functionName} : null;`,
    );
    fn = factory() as ((...args: unknown[]) => unknown) | null;
    if (typeof fn !== "function") {
      defError = `${functionName} is not defined — check the function name/signature.`;
    }
  } catch (e) {
    defError = (e as Error).message;
  }

  for (let index = 0; index < argsList.length; index++) {
    const t0 = performance.now();
    let value: unknown = null;
    let error: string | null = defError;
    if (fn && !defError) {
      try {
        const raw = fn(...argsList[index]!);
        value = raw === undefined ? null : (JSON.parse(JSON.stringify(raw)) as unknown);
      } catch (e) {
        error = (e as Error).message;
      }
    }
    self.postMessage({ type: "case", index, result: { value, error, ms: performance.now() - t0 } });
  }
  self.postMessage({ type: "done" });
};
