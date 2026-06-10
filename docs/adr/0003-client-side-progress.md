# ADR 0003 — Content-in-repo + device-local progress until auth lands

**Status:** Accepted · **Date:** 2026-06-11

## Context

Phase 2 specifies curriculum tables, progress PUT, and quiz-attempt POST backed by Postgres.
Server-side progress is meaningless without an authenticated user (PRD X1: "progress requires
account"), and neither OAuth credentials nor a provisioned database exist in this environment.

## Decision

1. **Curriculum metadata lives in `@algolens/content`** (typed manifest) and lesson bodies in
   `content/lessons/*.mdx` — exactly the TRD §2 "content in repo, metadata in DB" v1 pattern,
   with the manifest as the future seed source (the DB schema from docs/03 §2 already exists).
2. **Progress, quiz passes, and XP are device-local** (`localStorage`) behind a store whose
   mutation payloads match the API contracts (`progressPut`, `quizAttemptCreate`) byte-for-byte.
3. **The API routes exist now**: GETs serve the manifest; mutating routes Zod-validate and
   return `501 application/problem+json` explaining the constraint — no silent data loss.

## Consequences

- The full learning loop (read → visualize → quiz → replay-at-step → complete → continue) works
  today, anonymously, on production-shaped contracts.
- Wiring Auth.js + Postgres later changes the store's transport (localStorage → fetch), nothing
  else; a claim-on-signup job (docs/03 note 3) can migrate device progress into the account.
- Until then, progress does not roam across devices — surfaced honestly in the dashboard UI.
