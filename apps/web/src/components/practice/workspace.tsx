"use client";

import type { CaseResultPublic, SubmissionEvent, SubmissionView } from "@algolens/api-contracts";
import { Button, cn } from "@algolens/ui";
import { Activity, Check, CircleDashed, Loader2, Play, Send, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { retentionStore, type Difficulty } from "@/lib/retention";
import type { ExecResponse } from "@/workers/exec.worker";

const VERDICT_LABEL: Record<string, { short: string; tone: string }> = {
  accepted: { short: "Accepted", tone: "text-sorted" },
  wrong_answer: { short: "Wrong Answer", tone: "text-swap" },
  time_limit: { short: "Time Limit Exceeded", tone: "text-compare" },
  memory_limit: { short: "Memory Limit Exceeded", tone: "text-compare" },
  runtime_error: { short: "Runtime Error", tone: "text-swap" },
  compile_error: { short: "Compile Error", tone: "text-swap" },
  judge_error: { short: "Judge Error", tone: "text-muted" },
  queued: { short: "Queued", tone: "text-muted" },
  running: { short: "Running", tone: "text-secondary" },
};

interface SampleRun {
  stdout: string;
  error: string | null;
  ms: number;
  pass: boolean;
}

export interface WorkspaceProps {
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  starterCode: string;
  samples: { input: string; expected: string }[];
  hiddenCaseCount: number;
  timeLimitMs: number;
  statement: ReactNode;
  lessonSlug: string | null;
}

export function Workspace(props: WorkspaceProps) {
  const [code, setCode] = useState(props.starterCode);
  const [tab, setTab] = useState<"description" | "submissions">("description");
  const [sampleRuns, setSampleRuns] = useState<(SampleRun | null)[] | null>(null);
  const [running, setRunning] = useState(false);
  const [submission, setSubmission] = useState<SubmissionView | null>(null);
  const [liveCases, setLiveCases] = useState<CaseResultPublic[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<SubmissionView[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const killTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      sourceRef.current?.close();
      if (killTimer.current) window.clearTimeout(killTimer.current);
    },
    [],
  );

  // --- Run samples client-side (exec-worker, 5s kill) ------------------------------------------
  function runSamples() {
    workerRef.current?.terminate();
    setRunning(true);
    setSampleRuns(props.samples.map(() => null));

    const worker = new Worker(new URL("../../workers/exec.worker.ts", import.meta.url));
    workerRef.current = worker;
    killTimer.current = window.setTimeout(() => {
      worker.terminate();
      setRunning(false);
      setSampleRuns((prev) =>
        (prev ?? []).map(
          (r) => r ?? { stdout: "", error: "killed after 5s (infinite loop?)", ms: 5000, pass: false },
        ),
      );
    }, 5000);

    worker.onmessage = (event: MessageEvent<ExecResponse>) => {
      const msg = event.data;
      if (msg.type === "case") {
        setSampleRuns((prev) => {
          const next = [...(prev ?? [])];
          const expected = props.samples[msg.index]!.expected;
          const normalize = (s: string) =>
            s.replace(/\r\n/g, "\n").split("\n").map((l) => l.trimEnd()).join("\n").trim();
          next[msg.index] = {
            ...msg.result,
            pass: msg.result.error === null && normalize(msg.result.stdout) === normalize(expected),
          };
          return next;
        });
      }
      if (msg.type === "done") {
        setRunning(false);
        if (killTimer.current) window.clearTimeout(killTimer.current);
        worker.terminate();
      }
    };

    worker.postMessage({ type: "exec", code, inputs: props.samples.map((s) => s.input) });
  }

  // --- Submit (server judge via SSE) ------------------------------------------------------------
  async function submit() {
    setSubmitting(true);
    setSubmission(null);
    setLiveCases([]);
    try {
      const res = await fetch("/api/v1/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          problemSlug: props.slug,
          language: "javascript",
          sourceCode: code,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      if (!res.ok) {
        const problem = (await res.json()) as { title?: string; detail?: string };
        setSubmission({
          id: "error",
          problemSlug: props.slug,
          status: "judge_error",
          passedCount: 0,
          totalCount: 0,
          runtimeMs: null,
          cases: [],
          createdAt: new Date().toISOString(),
        });
        setSubmitting(false);
        console.error(problem);
        return;
      }
      const { id } = (await res.json()) as { id: string };

      sourceRef.current?.close();
      const source = new EventSource(`/api/v1/submissions/${id}/events`);
      sourceRef.current = source;
      source.onmessage = (e) => {
        const event = JSON.parse(e.data) as SubmissionEvent;
        if (event.type === "snapshot") setSubmission(event.submission);
        if (event.type === "case") setLiveCases((prev) => [...prev, event.result]);
        if (event.type === "done") {
          setSubmission(event.submission);
          setLiveCases(event.submission.cases);
          setHistory((prev) => [event.submission, ...prev].slice(0, 10));
          setSubmitting(false);
          source.close();
          if (event.submission.status === "accepted") {
            retentionStore.recordProblemSolved(props.slug, props.difficulty, props.tags);
            try {
              sessionStorage.setItem("algolens-lab-code", code);
            } catch {
              /* ignore */
            }
          }
        }
      };
      source.onerror = () => {
        // EventSource auto-reconnects; each reconnect re-receives a full snapshot.
      };
    } catch {
      setSubmitting(false);
    }
  }

  const totalCases = submission?.totalCount ?? 0;
  const verdict = submission && VERDICT_LABEL[submission.status];

  return (
    <div className="grid gap-5 py-4 lg:grid-cols-2">
      {/* Left: statement */}
      <div className="min-w-0">
        <div role="tablist" className="mb-3 flex gap-1 border-b border-subtle">
          {(
            [
              ["description", "Description"],
              ["submissions", `Submissions${history.length ? ` (${history.length})` : ""}`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "rounded-t-lg px-3 py-2 text-sm transition-colors",
                tab === id ? "bg-raised text-foreground" : "text-secondary hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto self-center text-xs text-muted">Editorial 🔒 after launch</span>
        </div>

        {tab === "description" && (
          <article className="prose prose-invert max-w-none prose-p:text-secondary prose-strong:text-foreground prose-a:text-primary prose-code:rounded prose-code:bg-raised prose-code:px-1 prose-code:font-mono prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none">
            {props.statement}
            <h3>Samples</h3>
            {props.samples.map((s, i) => (
              <pre key={i} className="border border-subtle bg-raised">
                <code>{`input:\n${s.input}\n\noutput:\n${s.expected}`}</code>
              </pre>
            ))}
            <p className="text-xs">
              Submitting also runs {props.hiddenCaseCount} hidden case
              {props.hiddenCaseCount === 1 ? "" : "s"}. Time limit: {props.timeLimitMs} ms per case.
            </p>
          </article>
        )}

        {tab === "submissions" && (
          <ul className="flex flex-col gap-2">
            {history.length === 0 && <li className="text-sm text-muted">No submissions this session yet.</li>}
            {history.map((s, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg border border-subtle bg-surface px-3 py-2 text-sm">
                <span className={cn("font-semibold", VERDICT_LABEL[s.status]?.tone)}>
                  {VERDICT_LABEL[s.status]?.short ?? s.status}
                </span>
                <span className="font-mono text-xs text-secondary">
                  {s.passedCount}/{s.totalCount} cases
                </span>
                <span className="ml-auto font-mono text-xs text-muted">
                  {new Date(s.createdAt).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Right: editor + results drawer */}
      <div className="flex min-w-0 flex-col gap-3">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          rows={16}
          aria-label="Solution editor"
          className="w-full resize-y rounded-xl border border-subtle bg-surface p-4 font-mono text-[13px] leading-6 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={runSamples} disabled={running || submitting}>
            {running ? <Loader2 className="animate-spin" /> : <Play />}
            Run samples
          </Button>
          <Button onClick={submit} disabled={running || submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : <Send />}
            Submit
          </Button>
        </div>

        {/* Sample results */}
        {sampleRuns && (
          <section className="rounded-xl border border-subtle bg-surface p-4" aria-live="polite">
            <h3 className="mb-2 text-sm font-medium text-foreground">Sample runs (in your browser)</h3>
            <ul className="flex flex-col gap-2">
              {sampleRuns.map((run, i) => (
                <li key={i} className="rounded-lg border border-subtle bg-raised p-3 font-mono text-xs">
                  {run === null ? (
                    <span className="text-muted">running…</span>
                  ) : (
                    <>
                      <p className={run.pass ? "text-sorted" : "text-swap"}>
                        {run.pass ? "✓ pass" : "✗ fail"} · {run.ms.toFixed(1)} ms
                      </p>
                      {run.error ? (
                        <p className="mt-1 text-swap">{run.error}</p>
                      ) : (
                        !run.pass && (
                          <p className="mt-1 text-secondary">
                            got {JSON.stringify(run.stdout)} · want{" "}
                            {JSON.stringify(props.samples[i]!.expected)}
                          </p>
                        )
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Submission progress + verdict */}
        {submission && (
          <section className="rounded-xl border border-subtle bg-surface p-4" aria-live="polite">
            <h3 className="mb-2 text-sm font-medium text-foreground">
              Submission — {totalCases} cases (incl. hidden)
            </h3>
            <div className="flex flex-wrap gap-1.5" aria-label="Per-case results">
              {Array.from({ length: totalCases }, (_, i) => {
                const c = liveCases.find((lc) => lc.index === i);
                return (
                  <span
                    key={i}
                    title={c ? `${c.status}${c.isSample ? " (sample)" : " (hidden)"}` : "pending"}
                    className={cn(
                      "grid size-7 place-items-center rounded-md border border-subtle",
                      !c && "bg-raised",
                      c?.status === "accepted" && "bg-[color-mix(in_srgb,var(--viz-sorted)_25%,transparent)] text-sorted",
                      c && c.status !== "accepted" && "bg-[color-mix(in_srgb,var(--viz-swap)_20%,transparent)] text-swap",
                    )}
                  >
                    {!c ? (
                      <CircleDashed className="size-3.5 animate-spin text-muted" />
                    ) : c.status === "accepted" ? (
                      <Check className="size-4" />
                    ) : (
                      <X className="size-4" />
                    )}
                  </span>
                );
              })}
            </div>

            {verdict && submission.status !== "running" && submission.status !== "queued" && (
              <div className="mt-3 border-t border-subtle pt-3">
                <p className={cn("text-lg font-bold", verdict.tone)}>{verdict.short}</p>
                <p className="font-mono text-xs text-secondary">
                  {submission.passedCount}/{submission.totalCount} cases
                  {submission.runtimeMs != null && ` · ${submission.runtimeMs} ms max`}
                </p>
                {submission.status === "accepted" && (
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    <Link href="/analyze" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                      <Activity className="size-4" />
                      Check its complexity →
                    </Link>
                    {props.lessonSlug && (
                      <Link href={`/learn/dsa-foundations/${props.lessonSlug}`} className="text-secondary hover:text-foreground hover:underline">
                        Back to the lesson
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
