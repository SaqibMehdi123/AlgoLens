/// <reference lib="webworker" />
/**
 * exec-worker (TRD §1): client-side SAMPLE runs. User code executes here — never on the page
 * thread (rule 5). The page enforces the 5s wall-clock kill by terminating this worker; the
 * console shim caps output at 64k chars per case.
 */
export interface ExecRequest {
  type: "exec";
  code: string;
  inputs: string[];
}

export interface ExecCaseResult {
  stdout: string;
  error: string | null;
  ms: number;
}

export type ExecResponse =
  | { type: "case"; index: number; result: ExecCaseResult }
  | { type: "done" };

const OUTPUT_CAP = 64_000;

self.onmessage = (event: MessageEvent<ExecRequest>) => {
  const { code, inputs } = event.data;
  for (let index = 0; index < inputs.length; index++) {
    const lines: string[] = [];
    let chars = 0;
    let error: string | null = null;
    const sandboxConsole = {
      log: (...args: unknown[]) => {
        const line = args.map(String).join(" ");
        chars += line.length;
        if (chars > OUTPUT_CAP) throw new Error("output limit exceeded (64k)");
        lines.push(line);
      },
      error: () => undefined,
      warn: () => undefined,
    };
    const t0 = performance.now();
    try {
      // Untrusted code, but we're inside a dedicated worker: no DOM, terminated on timeout.
      const fn = new Function("input", "console", `"use strict";\n${code}`);
      fn(inputs[index], sandboxConsole);
    } catch (e) {
      error = (e as Error).message ?? String(e);
    }
    const ms = performance.now() - t0;
    const response: ExecResponse = {
      type: "case",
      index,
      result: { stdout: lines.join("\n"), error, ms },
    };
    self.postMessage(response);
  }
  self.postMessage({ type: "done" } satisfies ExecResponse);
};
