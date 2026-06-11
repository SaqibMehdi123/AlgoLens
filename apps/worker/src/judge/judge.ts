/**
 * JS judge v1 (TRD §6 MVP): every test case runs in a fresh CHILD PROCESS with
 *  - Node's permission model (`--permission`): fs / child_process / worker_threads denied,
 *  - `--max-old-space-size=128`: heap capped (OOM → memory_limit),
 *  - a bare `vm` context inside the child: no require, no process, no fetch — only `input`
 *    and a console shim defined INSIDE the context (no host functions cross the boundary,
 *    so constructor-chain escapes only ever reach the already-restricted child),
 *  - vm script timeout (sync loops) + parent SIGKILL watchdog (anything else),
 *  - output capped in the shim (1MB) and the parent (2MB buffer).
 *
 * Defense in depth, not perfection: the production boundary is Judge0 CE on an isolated VM
 * (TRD §7 — staged for a later phase). This judge is the same call signature that the BullMQ
 * consumer will keep when Judge0 replaces the inner runner.
 */
import { spawn } from "node:child_process";

export type CaseStatus =
  | "accepted"
  | "wrong_answer"
  | "time_limit"
  | "memory_limit"
  | "runtime_error"
  | "compile_error"
  | "judge_error";

export interface JudgeCase {
  input: string;
  expected: string;
}

export interface CaseResult {
  status: CaseStatus;
  runtimeMs: number;
  stdoutExcerpt: string | null;
  stderrExcerpt: string | null;
}

export interface JudgeRequest {
  sourceCode: string;
  cases: JudgeCase[];
  timeLimitMs?: number;
}

export interface JudgeResult {
  verdict: CaseStatus;
  passedCount: number;
  totalCount: number;
  runtimeMs: number;
  cases: CaseResult[];
}

const SENTINEL = "@@ALGOLENS_RESULT@@";
const EXCERPT_LIMIT = 1024;
const PARENT_STDOUT_CAP = 2 * 1024 * 1024;

/**
 * The child harness, embedded as a string and run via `node -e` so no file path resolution is
 * needed wherever the judge is bundled. Reads {source,input,timeoutMs} JSON on stdin; writes a
 * SENTINEL-prefixed result JSON on stdout. The console shim and output buffer live INSIDE the
 * vm context — only primitive strings are extracted back out.
 */
const RUNNER_SOURCE = `
const vm = require("node:vm");
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => { raw += c; });
process.stdin.on("end", () => {
  const { source, input, timeoutMs } = JSON.parse(raw);
  const finish = (obj) => { process.stdout.write("\\n${SENTINEL}" + JSON.stringify(obj)); process.exit(0); };
  const ctx = vm.createContext(Object.create(null));
  try {
    vm.runInContext(
      "'use strict';" +
      "var __out = [];" +
      "var __chars = 0;" +
      "var __truncated = false;" +
      "var console = { log: function () {" +
      "  if (__truncated) { throw new Error('OUTPUT_LIMIT'); }" +
      "  var parts = [];" +
      "  for (var i = 0; i < arguments.length; i++) { parts.push(String(arguments[i])); }" +
      "  var line = parts.join(' ');" +
      "  __chars += line.length;" +
      "  if (__chars > 1000000) { __truncated = true; throw new Error('OUTPUT_LIMIT'); }" +
      "  __out.push(line);" +
      "}, error: function () {}, warn: function () {} };",
      ctx,
    );
    ctx.input = String(input);
  } catch (e) {
    finish({ status: "judge_error", stdout: "", error: String(e && e.message) });
    return;
  }

  let script;
  try {
    script = new vm.Script(String(source), { filename: "submission.js" });
  } catch (e) {
    finish({ status: "compile_error", stdout: "", error: String(e && e.message) });
    return;
  }

  let status = "ok";
  let error = null;
  try {
    script.runInContext(ctx, { timeout: timeoutMs, displayErrors: true });
  } catch (e) {
    const msg = String((e && e.message) || e);
    if ((e && e.code === "ERR_SCRIPT_EXECUTION_TIMED_OUT") || msg.includes("Script execution timed out")) status = "time_limit";
    else if (msg.includes("OUTPUT_LIMIT")) { status = "runtime_error"; error = "output limit exceeded (1MB)"; }
    else { status = "runtime_error"; error = msg.slice(0, 500); }
  }

  let stdout = "";
  try { stdout = vm.runInContext("__out.join('\\\\n')", ctx); } catch (e) { /* keep empty */ }
  finish({ status, stdout: String(stdout).slice(0, 1000000), error });
});
`;

interface RunnerReply {
  status: "ok" | "time_limit" | "runtime_error" | "compile_error" | "judge_error";
  stdout: string;
  error: string | null;
}

function runCase(
  sourceCode: string,
  input: string,
  timeLimitMs: number,
): Promise<{ reply: RunnerReply | null; killed: boolean; stderr: string; ms: number }> {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ["--permission", "--max-old-space-size=128", "-e", RUNNER_SOURCE],
      {
        // Deliberately empty: parent secrets never reach submissions. (Cast needed because
        // Next.js augments ProcessEnv with a required NODE_ENV when web typechecks this file.)
        env: {} as NodeJS.ProcessEnv,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      },
    );

    let stdout = "";
    let stderr = "";
    let killed = false;
    const start = Date.now();

    // Watchdog: vm timeout handles sync loops; this catches everything else (async, runaway IO).
    const watchdog = setTimeout(() => {
      killed = true;
      child.kill("SIGKILL");
    }, timeLimitMs * 3 + 1500);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
      if (stdout.length > PARENT_STDOUT_CAP) {
        killed = true;
        child.kill("SIGKILL");
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < 8192) stderr += chunk.toString("utf8");
    });
    child.on("error", () => {
      clearTimeout(watchdog);
      resolve({ reply: null, killed, stderr, ms: Date.now() - start });
    });
    child.on("close", () => {
      clearTimeout(watchdog);
      const idx = stdout.lastIndexOf(SENTINEL);
      let reply: RunnerReply | null = null;
      if (idx >= 0) {
        try {
          reply = JSON.parse(stdout.slice(idx + SENTINEL.length)) as RunnerReply;
        } catch {
          reply = null;
        }
      }
      resolve({ reply, killed, stderr, ms: Date.now() - start });
    });

    child.stdin.write(JSON.stringify({ source: sourceCode, input, timeoutMs: timeLimitMs }));
    child.stdin.end();
  });
}

/** Trim trailing whitespace per line, normalize newlines, trim the whole — TRD §6 comparison. */
export function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

const excerpt = (s: string | null): string | null =>
  s === null ? null : s.slice(0, EXCERPT_LIMIT);

export async function judgeSubmission(req: JudgeRequest): Promise<JudgeResult> {
  const timeLimitMs = req.timeLimitMs ?? 2000;
  const results: CaseResult[] = [];
  let verdict: CaseStatus = "accepted";
  let passedCount = 0;
  let maxMs = 0;

  for (const testCase of req.cases) {
    const { reply, killed, stderr, ms } = await runCase(req.sourceCode, testCase.input, timeLimitMs);
    maxMs = Math.max(maxMs, ms);

    let status: CaseStatus;
    let out: string | null = null;
    if (reply === null) {
      // Child died without reporting: OOM abort, SIGKILL watchdog, or stdout flood.
      if (/heap out of memory|allocation failed/i.test(stderr)) status = "memory_limit";
      else if (killed) status = ms >= timeLimitMs * 2 ? "time_limit" : "runtime_error";
      else status = "judge_error";
    } else if (reply.status === "ok") {
      out = reply.stdout;
      status = normalizeOutput(out) === normalizeOutput(testCase.expected) ? "accepted" : "wrong_answer";
    } else {
      status = reply.status;
      out = reply.stdout;
    }

    results.push({
      status,
      runtimeMs: ms,
      stdoutExcerpt: excerpt(out),
      stderrExcerpt: excerpt(reply?.error ?? (stderr || null)),
    });

    if (status === "accepted") {
      passedCount++;
    } else if (verdict === "accepted") {
      verdict = status; // first failure decides the submission verdict
    }
    // Compile errors are identical for every case — stop early.
    if (status === "compile_error") break;
  }

  return {
    verdict,
    passedCount,
    totalCount: req.cases.length,
    runtimeMs: maxMs,
    cases: results,
  };
}
