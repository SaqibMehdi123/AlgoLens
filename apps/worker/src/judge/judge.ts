/**
 * JS/TS judge v1 — LeetCode-style "implement this function" (TRD §6 MVP).
 *
 * The user submits a function definition; the judge calls it with each test case's structured
 * `args` and compares the RETURN VALUE. Isolation (unchanged from the stdin/stdout version):
 *  - fresh CHILD PROCESS per submission, Node `--permission` (fs/net/child_process denied),
 *    `--max-old-space-size=128`, clean `env: {}`,
 *  - a bare `vm` context — no `require`, `process`, `fetch`, `setTimeout`; only ECMAScript
 *    intrinsics + a no-op `console`,
 *  - **args cross the boundary as a JSON string** and are re-parsed by the sandbox's own
 *    `JSON.parse`, so no host object (and thus no host realm `Function`) is ever exposed to user
 *    code — the classic vm-escape vector is closed,
 *  - per-call `vm` timeout (sync loops) + a parent SIGKILL watchdog (everything else).
 *
 * TypeScript is transpiled to JS here (host side) before it reaches the sandbox. C++/Java/Python
 * are NOT run here — they require the Judge0 host (TRD §7); the API routes reject them honestly.
 *
 * Production swaps the inner runner for Judge0 CE; this call signature stays.
 */
import { spawn } from "node:child_process";
import ts from "typescript";

export type CaseStatus =
  | "accepted"
  | "wrong_answer"
  | "time_limit"
  | "memory_limit"
  | "runtime_error"
  | "compile_error"
  | "judge_error";

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
export type CompareMode = "exact" | "unordered";
export type JudgeLanguage = "javascript" | "typescript";

export interface JudgeCase {
  args: Json[];
  expected: Json;
}

export interface CaseResult {
  status: CaseStatus;
  runtimeMs: number;
  /** The function's returned value (JSON) — shown for sample cases, redacted for hidden ones. */
  stdoutExcerpt: string | null;
  stderrExcerpt: string | null;
}

export interface JudgeRequest {
  language: JudgeLanguage;
  sourceCode: string;
  functionName: string;
  cases: JudgeCase[];
  compare?: CompareMode;
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
const NOFN = "@@NO_FUNCTION@@";
const EXCERPT_LIMIT = 1024;
const RESULT_CAP = 2 * 1024 * 1024;

/**
 * Child harness (run via `node -e`). Reads {source, functionName, argsList, timeoutMs, resultCap}
 * on stdin; defines the user source in a bare vm context; calls the function per case with args
 * re-parsed inside the sandbox; writes a SENTINEL-prefixed JSON result.
 */
const RUNNER_SOURCE = `
const vm = require("node:vm");
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => { raw += c; });
process.stdin.on("end", () => {
  const { source, functionName, argsList, timeoutMs, resultCap } = JSON.parse(raw);
  const finish = (o) => { process.stdout.write("\\n${SENTINEL}" + JSON.stringify(o)); process.exit(0); };
  const ctx = vm.createContext(Object.create(null));
  // No-op console so debug prints don't crash; nothing escapes the sandbox.
  try {
    vm.runInContext("var console={log:function(){},error:function(){},warn:function(){},info:function(){}};", ctx);
  } catch (e) { finish({ compileError: "context init failed" }); return; }

  let script;
  try { script = new vm.Script(String(source), { filename: "solution.js" }); }
  catch (e) { finish({ compileError: String((e && e.message) || e) }); return; }

  try { script.runInContext(ctx, { timeout: timeoutMs }); }
  catch (e) { finish({ defError: String((e && e.message) || e) }); return; }

  const results = [];
  for (const args of argsList) {
    // Primitive string crosses the boundary; sandbox JSON.parse rebuilds the args with sandbox
    // prototypes — user code never receives a host object.
    ctx.__argsJson = JSON.stringify(args);
    const t0 = Date.now();
    try {
      const expr = "(typeof " + functionName + " === 'function')"
        + " ? JSON.stringify(" + functionName + "(...JSON.parse(__argsJson)))"
        + " : '" + ${JSON.stringify(NOFN)} + "'";
      const r = vm.runInContext(expr, ctx, { timeout: timeoutMs });
      const ms = Date.now() - t0;
      if (r === ${JSON.stringify(NOFN)}) results.push({ status: "runtime_error", ms, error: functionName + " is not defined (check the function name/signature)" });
      else if (typeof r !== "string") results.push({ status: "runtime_error", ms, error: "function returned a non-serializable value" });
      else if (r.length > resultCap) results.push({ status: "runtime_error", ms, error: "returned value too large" });
      else results.push({ status: "ok", ms, result: r });
    } catch (e) {
      const ms = Date.now() - t0;
      const msg = String((e && e.message) || e);
      if ((e && e.code === "ERR_SCRIPT_EXECUTION_TIMED_OUT") || msg.indexOf("Script execution timed out") >= 0)
        results.push({ status: "time_limit", ms });
      else results.push({ status: "runtime_error", ms, error: msg.slice(0, 500) });
    }
  }
  finish({ results });
});
`;

interface RunnerCase {
  status: "ok" | "time_limit" | "runtime_error";
  ms: number;
  result?: string;
  error?: string;
}
interface RunnerReply {
  compileError?: string;
  defError?: string;
  results?: RunnerCase[];
}

function transpile(source: string, language: JudgeLanguage): { code: string; error?: string } {
  if (language === "javascript") return { code: source };
  try {
    const out = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
      reportDiagnostics: false,
    });
    return { code: out.outputText };
  } catch (e) {
    return { code: "", error: (e as Error).message };
  }
}

function runAll(
  source: string,
  functionName: string,
  argsList: Json[][],
  timeLimitMs: number,
): Promise<{ reply: RunnerReply | null; killed: boolean; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ["--permission", "--max-old-space-size=128", "-e", RUNNER_SOURCE],
      { env: {} as NodeJS.ProcessEnv, stdio: ["pipe", "pipe", "pipe"], windowsHide: true },
    );
    let stdout = "";
    let stderr = "";
    let killed = false;
    const watchdog = setTimeout(
      () => {
        killed = true;
        child.kill("SIGKILL");
      },
      argsList.length * timeLimitMs * 2 + 3000,
    );
    child.stdout.on("data", (c: Buffer) => {
      stdout += c.toString("utf8");
      if (stdout.length > RESULT_CAP * 2) {
        killed = true;
        child.kill("SIGKILL");
      }
    });
    child.stderr.on("data", (c: Buffer) => {
      if (stderr.length < 8192) stderr += c.toString("utf8");
    });
    child.on("error", () => {
      clearTimeout(watchdog);
      resolve({ reply: null, killed, stderr });
    });
    child.on("close", () => {
      clearTimeout(watchdog);
      const i = stdout.lastIndexOf(SENTINEL);
      let reply: RunnerReply | null = null;
      if (i >= 0) {
        try {
          reply = JSON.parse(stdout.slice(i + SENTINEL.length)) as RunnerReply;
        } catch {
          reply = null;
        }
      }
      resolve({ reply, killed, stderr });
    });
    child.stdin.write(
      JSON.stringify({ source, functionName, argsList, timeoutMs: timeLimitMs, resultCap: RESULT_CAP }),
    );
    child.stdin.end();
  });
}

const excerpt = (s: string | null | undefined): string | null =>
  s == null ? null : s.slice(0, EXCERPT_LIMIT);

/** Compare a returned value to the expected one. `unordered` treats top-level arrays as multisets. */
export function resultsEqual(actual: Json, expected: Json, mode: CompareMode): boolean {
  if (mode === "unordered") {
    if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
    const norm = (a: Json[]) => a.map((x) => JSON.stringify(x)).sort();
    return JSON.stringify(norm(actual)) === JSON.stringify(norm(expected));
  }
  return JSON.stringify(actual) === JSON.stringify(expected);
}

export async function judgeSubmission(req: JudgeRequest): Promise<JudgeResult> {
  const timeLimitMs = req.timeLimitMs ?? 2000;
  const compare = req.compare ?? "exact";
  const total = req.cases.length;

  const { code, error: tsError } = transpile(req.sourceCode, req.language);
  if (tsError) {
    return compileErrorResult(total, tsError);
  }

  const { reply, killed, stderr } = await runAll(
    code,
    req.functionName,
    req.cases.map((c) => c.args),
    timeLimitMs,
  );

  if (reply?.compileError != null) return compileErrorResult(total, reply.compileError);
  if (reply?.defError != null) {
    return uniformResult(total, "runtime_error", `error while defining the function: ${reply.defError}`);
  }
  if (!reply?.results) {
    // Child died without reporting: OOM, watchdog kill, or output flood.
    const status: CaseStatus = /heap out of memory|allocation failed/i.test(stderr)
      ? "memory_limit"
      : killed
        ? "time_limit"
        : "judge_error";
    return uniformResult(total, status, status === "memory_limit" ? "exceeded 128MB" : "execution halted");
  }

  const cases: CaseResult[] = [];
  let verdict: CaseStatus = "accepted";
  let passed = 0;
  let maxMs = 0;

  req.cases.forEach((testCase, i) => {
    const rc = reply.results![i];
    let status: CaseStatus;
    let out: string | null = null;
    if (!rc) {
      status = "judge_error";
    } else if (rc.status === "ok") {
      out = rc.result ?? "null";
      let actual: Json = null;
      try {
        actual = JSON.parse(rc.result ?? "null") as Json;
      } catch {
        /* keep null */
      }
      status = resultsEqual(actual, testCase.expected, compare) ? "accepted" : "wrong_answer";
    } else {
      status = rc.status;
      out = rc.error ?? null;
    }
    maxMs = Math.max(maxMs, rc?.ms ?? 0);
    cases.push({
      status,
      runtimeMs: rc?.ms ?? 0,
      stdoutExcerpt: excerpt(out),
      stderrExcerpt: status === "runtime_error" ? excerpt(rc?.error) : null,
    });
    if (status === "accepted") passed++;
    else if (verdict === "accepted") verdict = status;
  });

  return { verdict, passedCount: passed, totalCount: total, runtimeMs: maxMs, cases };
}

function compileErrorResult(total: number, message: string): JudgeResult {
  return {
    verdict: "compile_error",
    passedCount: 0,
    totalCount: total,
    runtimeMs: 0,
    // One row — a compile error is identical for every case.
    cases: [{ status: "compile_error", runtimeMs: 0, stdoutExcerpt: null, stderrExcerpt: excerpt(message) }],
  };
}

function uniformResult(total: number, status: CaseStatus, message: string): JudgeResult {
  return {
    verdict: status,
    passedCount: 0,
    totalCount: total,
    runtimeMs: 0,
    cases: Array.from({ length: Math.max(total, 1) }, () => ({
      status,
      runtimeMs: 0,
      stdoutExcerpt: null,
      stderrExcerpt: excerpt(message),
    })),
  };
}
