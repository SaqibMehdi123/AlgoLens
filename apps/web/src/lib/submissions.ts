/**
 * In-memory submission store + direct judging (ADR-0004).
 *
 * Without Redis/BullMQ + Postgres, submissions live in process memory and the API calls the
 * SAME hardened judge module (child-process isolation in @algolens/worker) directly instead of
 * via a queue. The contract shapes are final — swapping to queue+DB later changes this module's
 * internals, not its callers. Hidden-case redaction happens HERE, before anything is emitted:
 * the public view never carries hidden inputs/expecteds, and hidden stdout is verdict-only.
 */
import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import type { CaseResultPublic, SubmissionEvent, SubmissionView } from "@algolens/api-contracts";
import { getProblem } from "@algolens/content";
import { judgeSubmission, type CaseStatus } from "@algolens/worker/judge";

interface SubmissionRecord {
  view: SubmissionView;
  idempotencyKey: string;
}

interface Store {
  byId: Map<string, SubmissionRecord>;
  byIdempotency: Map<string, string>;
  emitter: EventEmitter;
}

// Survive Next.js dev HMR module reloads.
const g = globalThis as unknown as { __algolensSubmissions?: Store };
function store(): Store {
  if (!g.__algolensSubmissions) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(100);
    g.__algolensSubmissions = { byId: new Map(), byIdempotency: new Map(), emitter };
  }
  return g.__algolensSubmissions;
}

const eventName = (id: string) => `submission:${id}`;

export function getSubmission(id: string): SubmissionView | null {
  return store().byId.get(id)?.view ?? null;
}

export function subscribeToSubmission(
  id: string,
  listener: (event: SubmissionEvent) => void,
): () => void {
  const s = store();
  s.emitter.on(eventName(id), listener);
  return () => s.emitter.off(eventName(id), listener);
}

function emit(id: string, event: SubmissionEvent): void {
  store().emitter.emit(eventName(id), event);
}

export interface CreateResult {
  id: string;
  deduplicated: boolean;
}

export function createSubmission(input: {
  problemSlug: string;
  sourceCode: string;
  idempotencyKey: string;
}): CreateResult | { error: "problem_not_found" } {
  const s = store();
  const existing = s.byIdempotency.get(input.idempotencyKey);
  if (existing) return { id: existing, deduplicated: true };

  const problem = getProblem(input.problemSlug);
  if (!problem) return { error: "problem_not_found" };

  const id = randomUUID();
  const view: SubmissionView = {
    id,
    problemSlug: input.problemSlug,
    status: "queued",
    passedCount: 0,
    totalCount: problem.cases.length,
    runtimeMs: null,
    cases: [],
    createdAt: new Date().toISOString(),
  };
  s.byId.set(id, { view, idempotencyKey: input.idempotencyKey });
  s.byIdempotency.set(input.idempotencyKey, id);

  // Fire-and-forget judging; SSE subscribers get case ticks as they land.
  void runJudge(id, input.sourceCode);

  return { id, deduplicated: false };
}

async function runJudge(id: string, sourceCode: string): Promise<void> {
  const record = store().byId.get(id);
  if (!record) return;
  const problem = getProblem(record.view.problemSlug);
  if (!problem) return;

  record.view = { ...record.view, status: "running" };
  emit(id, { type: "snapshot", submission: record.view });

  try {
    const result = await judgeSubmission({
      sourceCode,
      cases: problem.cases.map((c) => ({ input: c.input, expected: c.expected })),
      timeLimitMs: problem.timeLimitMs,
    });

    const publicCases: CaseResultPublic[] = result.cases.map((c, index) => {
      const isSample = problem.cases[index]?.isSample ?? false;
      return {
        index,
        isSample,
        status: c.status,
        runtimeMs: c.runtimeMs,
        // Rule 6: hidden-case output is redacted to verdict-only in EVERY response shape.
        stdoutExcerpt: isSample ? c.stdoutExcerpt : null,
        stderrExcerpt: isSample ? c.stderrExcerpt : null,
      };
    });

    for (const c of publicCases) emit(id, { type: "case", result: c });

    record.view = {
      ...record.view,
      status: result.verdict as SubmissionView["status"],
      passedCount: result.passedCount,
      totalCount: result.totalCount,
      runtimeMs: result.runtimeMs,
      cases: publicCases,
    };
  } catch {
    record.view = { ...record.view, status: "judge_error" satisfies CaseStatus };
  }
  emit(id, { type: "done", submission: record.view });
}
