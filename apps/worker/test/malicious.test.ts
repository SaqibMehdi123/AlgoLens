/**
 * Malicious-submission suite (TRD §6/§7) — re-expressed for the function harness. Each hostile
 * submission is a `solve()` the judge calls; every attack must be CONTAINED with a non-AC verdict
 * and no host leak. Runs the real judge — no mocks.
 */
import { describe, expect, it } from "vitest";
import { judgeSubmission } from "../src/judge";

const judgeHostile = (source: string, timeLimitMs = 2000) =>
  judgeSubmission({
    language: "javascript",
    sourceCode: source,
    functionName: "solve",
    cases: [{ args: [], expected: null }],
    timeLimitMs,
  });

describe("malicious submissions are contained", () => {
  it("infinite loop → time_limit", { timeout: 30_000 }, async () => {
    const r = await judgeHostile(`function solve(){ while (true) {} }`);
    expect(r.verdict).toBe("time_limit");
  });

  it("fork/spawn attempt → runtime_error (require unavailable)", { timeout: 30_000 }, async () => {
    const r = await judgeHostile(
      `function solve(){ const cp = require("child_process"); return cp.execSync("whoami").toString(); }`,
    );
    expect(r.verdict).toBe("runtime_error");
    expect(r.cases[0]!.stdoutExcerpt ?? "").not.toMatch(/root|\\\w+/);
  });

  it("fs read attempt → runtime_error, no file contents", { timeout: 30_000 }, async () => {
    const r = await judgeHostile(
      `function solve(){ const fs = require("fs"); return fs.readFileSync("package.json","utf8"); }`,
    );
    expect(r.verdict).toBe("runtime_error");
    expect(r.cases[0]!.stdoutExcerpt ?? "").not.toContain("algolens");
  });

  it("network attempt → runtime_error (no fetch in sandbox)", { timeout: 30_000 }, async () => {
    const r = await judgeHostile(`function solve(){ return fetch("https://example.com"); }`);
    expect(r.verdict).toBe("runtime_error");
  });

  it("setTimeout/async escape → runtime_error (no timers in sandbox)", { timeout: 30_000 }, async () => {
    const r = await judgeHostile(`function solve(){ return setTimeout(function(){}, 0); }`);
    expect(r.verdict).toBe("runtime_error");
  });

  it("huge returned value → contained (RE/MLE/TLE), bounded excerpt", { timeout: 60_000 }, async () => {
    const r = await judgeHostile(
      `function solve(){ const a = []; for (let i = 0; i < 1e7; i++) a.push("AAAAAAAA"); return a; }`,
    );
    expect(["runtime_error", "memory_limit", "time_limit"]).toContain(r.verdict);
    expect((r.cases[0]!.stdoutExcerpt ?? "").length).toBeLessThanOrEqual(1100);
  });

  it("deep recursion → runtime_error (stack overflow), host survives", { timeout: 30_000 }, async () => {
    const r = await judgeHostile(`function solve(){ function f(n){ return f(n+1); } return f(0); }`);
    expect(r.verdict).toBe("runtime_error");
  });

  it("memory bomb → contained", { timeout: 60_000 }, async () => {
    const r = await judgeHostile(
      `function solve(){ const a=[]; for(let i=0;i<1e6;i++){ a.push(new Array(1e4).fill(i)); } return a.length; }`,
    );
    expect(["memory_limit", "time_limit", "runtime_error"]).toContain(r.verdict);
  });

  it("constructor-chain / env exfiltration → parent canary never leaks", { timeout: 30_000 }, async () => {
    process.env.ALGOLENS_CANARY = "super-secret-canary-value";
    try {
      const r = await judgeHostile(`function solve(){
        try {
          var P = this.constructor.constructor("return process")();
          return P.env.ALGOLENS_CANARY || "clean-env";
        } catch (e) { return "escape-blocked"; }
      }`);
      const out = (r.cases[0]!.stdoutExcerpt ?? "") + (r.cases[0]!.stderrExcerpt ?? "");
      expect(out).not.toContain("super-secret-canary-value");
    } finally {
      delete process.env.ALGOLENS_CANARY;
    }
  });

  it("syntax garbage → compile_error", { timeout: 30_000 }, async () => {
    const r = await judgeHostile(`function solve({ ]`);
    expect(r.verdict).toBe("compile_error");
  });
});
