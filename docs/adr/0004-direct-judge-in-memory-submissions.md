# ADR 0004 — Direct judging + in-memory submissions until Redis/Postgres land

**Status:** Accepted · **Date:** 2026-06-11

## Context

TRD §6 routes submissions through Postgres rows + BullMQ + a separate worker host. Neither Redis
nor Postgres is provisioned in this environment, but the Practice loop (PRD story #4) needs to
work end-to-end: submit → per-case SSE ticks → verdict.

## Decision

1. **The judge is a real isolation boundary, not a stub**: every case runs in a fresh child
   process under Node's permission model (fs/child_process/workers denied), 128MB heap cap,
   vm-context with no host objects crossing the boundary, vm timeout + parent SIGKILL watchdog,
   bounded output. The malicious-submission suite (9 attacks) runs against it in CI.
2. **The web API calls the judge module directly** (`@algolens/worker/judge`) with an in-memory
   submission store (HMR-safe `globalThis` map + EventEmitter) instead of a queue. The SSE route
   sends a full snapshot on every (re)connect, so EventSource reconnects are idempotent.
3. **Contract shapes are final**: `submissionCreate` (with idempotency key), `submissionView`,
   SSE event union. Moving to BullMQ + Postgres changes the store internals, not the API.
4. Hidden-case redaction happens in the store before anything is emitted; the problem-detail
   schema has no field hidden cases could ride in. Both are leak-tested.

## Consequences

- The full Practice loop works today on one machine; submissions don't survive a server restart
  (acceptable for dev; the DB swap restores durability).
- Judge0 CE on an isolated VM remains the production execution path (TRD §7 checklist),
  staged exactly as the roadmap's week-17 step — the judge call signature already matches.
