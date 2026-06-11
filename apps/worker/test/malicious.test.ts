/**
 * The malicious-submission suite (Phase 4, written FIRST — TRD §6/§7: treat every submission
 * as hostile). Every attack must be CONTAINED (the judge returns a verdict; the host survives)
 * and produce the correct non-AC verdict. These run the real judge — no mocks.
 */
import { describe, expect, it } from "vitest";
import { judgeSubmission } from "../src/judge";

const CASES = [{ input: "1 2 3", expected: "6" }];

const judgeHostile = (sourceCode: string, timeLimitMs = 2000) =>
  judgeSubmission({ sourceCode, cases: CASES, timeLimitMs });

describe("malicious submissions are contained", () => {
  it("infinite loop → time_limit", { timeout: 30_000 }, async () => {
    const r = await judgeHostile(`while (true) {}`);
    expect(r.verdict).toBe("time_limit");
    expect(r.cases[0]!.status).toBe("time_limit");
  });

  it("infinite loop that also prints → contained, non-AC", { timeout: 30_000 }, async () => {
    const r = await judgeHostile(`while (true) { console.log("x"); }`);
    expect(["time_limit", "runtime_error"]).toContain(r.verdict);
  });

  it("fork/spawn attempt → runtime_error (no child_process available)", { timeout: 30_000 }, async () => {
    const r = await judgeHostile(`
      const cp = require("child_process");
      console.log(cp.execSync("whoami").toString());
    `);
    expect(r.verdict).toBe("runtime_error");
    expect(r.cases[0]!.stdoutExcerpt ?? "").not.toMatch(/\w+\\\w+|root/);
  });

  it("fs read attempt → runtime_error and no file contents leak", { timeout: 30_000 }, async () => {
    const r = await judgeHostile(`
      const fs = require("fs");
      console.log(fs.readFileSync("package.json", "utf8"));
    `);
    expect(r.verdict).toBe("runtime_error");
    expect(r.cases[0]!.stdoutExcerpt ?? "").not.toContain("algolens");
  });

  it("network attempt → runtime_error (no fetch/XHR in the sandbox)", { timeout: 30_000 }, async () => {
    const r = await judgeHostile(`
      fetch("https://example.com").then(r => console.log("got", r.status));
      console.log("sent");
    `);
    expect(r.verdict).toBe("runtime_error");
  });

  it("huge stdout (would be ~100MB) → contained with a bounded excerpt", { timeout: 60_000 }, async () => {
    const r = await judgeHostile(`
      const chunk = "A".repeat(10000);
      for (let i = 0; i < 10000; i++) console.log(chunk);
    `);
    expect(["runtime_error", "time_limit"]).toContain(r.verdict);
    // The host process must never hold the full payload.
    expect((r.cases[0]!.stdoutExcerpt ?? "").length).toBeLessThanOrEqual(1100);
  });

  it("deep recursion → runtime_error (stack overflow), not a host crash", { timeout: 30_000 }, async () => {
    const r = await judgeHostile(`function f(n) { return f(n + 1); } f(0);`);
    expect(r.verdict).toBe("runtime_error");
  });

  it("memory bomb → memory_limit or contained kill", { timeout: 60_000 }, async () => {
    const r = await judgeHostile(`
      const arrs = [];
      for (let i = 0; i < 1e6; i++) { arrs.push(new Array(1e4).fill(i)); }
      console.log(arrs.length);
    `);
    expect(["memory_limit", "time_limit", "runtime_error"]).toContain(r.verdict);
  });

  it("process/env access attempt → contained, parent secrets never leak", { timeout: 30_000 }, async () => {
    process.env.ALGOLENS_CANARY = "super-secret-canary-value";
    try {
      const r = await judgeHostile(`
        let leaked = "";
        try { leaked = process.env.ALGOLENS_CANARY || "no-process"; } catch (e) { leaked = "blocked"; }
        try {
          const p = this.constructor.constructor("return process")();
          leaked += "|" + (p.env.ALGOLENS_CANARY || "clean-env");
        } catch (e) { leaked += "|escape-blocked"; }
        console.log(leaked);
      `);
      const out = r.cases[0]!.stdoutExcerpt ?? "";
      expect(out).not.toContain("super-secret-canary-value");
    } finally {
      delete process.env.ALGOLENS_CANARY;
    }
  });

  it("syntax garbage → compile_error", { timeout: 30_000 }, async () => {
    const r = await judgeHostile(`function ( { ]`);
    expect(r.verdict).toBe("compile_error");
  });
});
