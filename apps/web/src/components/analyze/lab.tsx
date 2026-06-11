"use client";

import {
  GENERATOR_LABELS,
  mergeVerdict,
  type EmpiricalResult,
  type EmpiricalSample,
  type GeneratorKey,
  type StaticParseError,
  type StaticResult,
} from "@algolens/complexity";
import { cn, Button } from "@algolens/ui";
import { Play, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BenchMessage } from "@/workers/bench.worker";
import { AnnotatedSource } from "./annotated-source";
import { GrowthChart } from "./growth-chart";
import { VerdictCard } from "./verdict-card";

const SAMPLE_CODE = `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return [];
}`;

const GENERATORS = Object.entries(GENERATOR_LABELS) as [GeneratorKey, string][];
const WORKER_TIMEOUT_MS = 20_000;

type Phase = "idle" | "running" | "done";

export function ComplexityLab() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [generator, setGenerator] = useState<GeneratorKey>("random-array");
  const [phase, setPhase] = useState<Phase>("idle");
  const [staticResult, setStaticResult] = useState<StaticResult | StaticParseError | null>(null);
  const [samples, setSamples] = useState<EmpiricalSample[]>([]);
  const [empirical, setEmpirical] = useState<EmpiricalResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<number | null>(null);

  function cleanup() {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }

  useEffect(() => cleanup, []);

  // Accept code handed off from an accepted Practice submission ("Check its complexity →").
  useEffect(() => {
    try {
      const handoff = sessionStorage.getItem("algolens-lab-code");
      if (handoff) {
        setCode(handoff);
        sessionStorage.removeItem("algolens-lab-code");
      }
    } catch {
      /* ignore */
    }
  }, []);

  function analyze() {
    cleanup();
    setPhase("running");
    setStaticResult(null);
    setSamples([]);
    setEmpirical(null);
    setRunError(null);

    // User code runs ONLY in this dedicated worker (rule 5) — the page stays responsive,
    // and a hung run is recoverable by terminating the worker.
    const worker = new Worker(new URL("../../workers/bench.worker.ts", import.meta.url));
    workerRef.current = worker;

    timeoutRef.current = window.setTimeout(() => {
      cleanup();
      setRunError("run exceeded 20s wall clock — terminated (growth too steep to measure)");
      setPhase("done");
    }, WORKER_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<BenchMessage>) => {
      const msg = event.data;
      if (msg.type === "static") setStaticResult(msg.result);
      if (msg.type === "sample") setSamples((prev) => [...prev, msg.sample]);
      if (msg.type === "done") {
        if (msg.result.ok) setEmpirical(msg.result);
        else setRunError(msg.result.error);
        setPhase("done");
        cleanup();
      }
      if (msg.type === "error") {
        setRunError(msg.error);
        setPhase("done");
        cleanup();
      }
    };
    worker.onerror = (e) => {
      setRunError(e.message || "worker crashed");
      setPhase("done");
      cleanup();
    };

    worker.postMessage({ type: "run", code, generator });
  }

  function cancel() {
    cleanup();
    setRunError("cancelled");
    setPhase("done");
  }

  const staticOk = staticResult?.ok ? staticResult : null;
  const verdict = phase === "done" ? mergeVerdict(staticOk, empirical) : null;
  const likelyExponential = empirical?.budgetExhausted && empirical.maxN <= 128;

  return (
    <div className="grid gap-5 py-4 lg:grid-cols-2">
      {/* Left: editor + generator + run */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-medium uppercase tracking-wide text-muted" htmlFor="lab-code">
          Your function (JavaScript)
        </label>
        <textarea
          id="lab-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          rows={16}
          className="w-full resize-y rounded-xl border border-subtle bg-surface p-4 font-mono text-[13px] leading-6 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        <fieldset>
          <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Input generator — gen(n)
          </legend>
          <div className="flex flex-wrap gap-2">
            {GENERATORS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setGenerator(key)}
                aria-pressed={generator === key}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  generator === key
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-subtle bg-raised text-secondary hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex gap-2">
          {phase === "running" ? (
            <Button variant="secondary" onClick={cancel}>
              <Square />
              Cancel
            </Button>
          ) : (
            <Button onClick={analyze} size="lg">
              <Play />
              Analyze
            </Button>
          )}
          {phase === "running" && (
            <span className="self-center font-mono text-xs text-secondary" aria-live="polite">
              measuring… n = {samples.at(-1)?.n ?? "…"} ({samples.length} sizes)
            </span>
          )}
        </div>
        <p className="text-xs text-muted">
          The function runs in a sandboxed Web Worker against the chosen generator — never on the
          page thread. Static analysis never executes your code at all.
        </p>
      </div>

      {/* Right: results stack (docs/05 §5.4) */}
      <div className="flex flex-col gap-4" aria-live="polite">
        {phase === "idle" && (
          <div className="grid min-h-[200px] place-items-center rounded-xl border border-dashed border-subtle text-sm text-muted">
            Paste a function and hit Analyze — results appear here.
          </div>
        )}

        {verdict && <VerdictCard verdict={verdict} />}

        {likelyExponential && (
          <div className="rounded-xl border border-[var(--viz-swap)]/50 bg-[color-mix(in_srgb,var(--viz-swap)_8%,transparent)] p-4 text-sm text-foreground" role="status">
            <p className="font-semibold">Growth too steep — likely exponential.</p>
            <p className="mt-1 text-secondary">
              The run hit its time budget at n = {empirical?.maxN}. That bail-out is itself strong
              evidence of exponential growth.
            </p>
          </div>
        )}

        {staticResult && !staticResult.ok && (
          <div className="rounded-xl border border-subtle bg-surface p-4 text-sm" role="status">
            <p className="font-semibold text-swap">Static layer: parse error</p>
            <p className="mt-1 font-mono text-xs text-secondary">
              {staticResult.error}
              {staticResult.line ? ` (line ${staticResult.line})` : ""}
            </p>
            <p className="mt-1 text-xs text-muted">Empirical measurement still ran below.</p>
          </div>
        )}

        {runError && phase === "done" && (
          <div className="rounded-xl border border-subtle bg-surface p-4 text-sm" role="status">
            <p className="font-semibold text-swap">Empirical layer stopped</p>
            <p className="mt-1 font-mono text-xs text-secondary">{runError}</p>
          </div>
        )}

        {staticOk && <AnnotatedSource code={code} result={staticOk} />}
        {empirical && <GrowthChart result={empirical} />}

        {phase === "done" && (
          <p className="text-xs text-muted">
            AI walkthrough (Layer 3) ships in a later phase — and will only ever appear alongside
            these deterministic results, never instead of them.
          </p>
        )}
      </div>
    </div>
  );
}
