# Build status

Tracks progress against [06-implementation-roadmap.md](./06-implementation-roadmap.md).

## Done

### Phase 0 — Foundation (partial)

- ✅ pnpm + Turborepo monorepo, TRD §3 layout, TS strict (+ `noUncheckedIndexedAccess`).
- ✅ Design tokens (docs/05 §2) as Tailwind v4 `@theme` + CSS variables; dark default, `.light` class.
- ✅ shadcn-style `packages/ui` primitives (Button, Card, `cn`).
- ✅ `packages/db`: Drizzle schema for identity + curriculum + visualize domains; drizzle-kit config; seed.
- ✅ `packages/api-contracts`: Zod schemas (problem+json, pagination, visualize configs).
- ✅ `/api/v1/health` route; `infra/docker-compose.dev.yml` (postgres + redis); GitHub Actions CI.
- ⛔️ Not yet: Auth.js wiring, Sentry/PostHog init, Neon/Vercel deploy, role middleware.

### Phase 1 — Visualization engine (the heart) — complete

- ✅ `packages/algo-core` (zero deps): Step model (TRD §4.1), recorder with 20k-step/200ms caps,
  emitters; **12 algorithms** across 3 layouts — bubble/insertion/selection/merge/quick/heap sort,
  linear/binary search, BST insert/search, BFS, DFS.
- ✅ Golden-trace tests: exact step sequence for bubble; correctness (replay sorts), valid-line
  invariant, and snapshot fixtures for every algorithm. Recorder cap tests.
- ✅ `packages/viz-engine`: player state machine (`idle→ready→playing⇄paused→finished`) with
  **exact backward stepping** (pure `deriveState` fold), fake-timer unit tests; ArrayBars + Tree
  (d3-hierarchy) + Graph SVG renderers using the semantic palette.
- ✅ `apps/web`: `/visualize` catalog (ISR) + `/visualize/[slug]` playground — transport bar
  (play/pause/step/scrub/speed/share), line-synced pseudocode, variable + call-stack inspector,
  input controls, keyboard map, reduced-motion mode + aria-live captions, shareable URLs.
- ✅ Landing page with a live, scrubbable hero merge-sort.

### Phase 2 — Learn pillar (core loop complete)

- ✅ MDX pipeline (next-mdx-remote RSC + remark-gfm) with allowlisted components only:
  `<Viz/>` (embedded mini-player, opens at a meaningful frame, "open in playground" link),
  `<Quiz/>` (complexity_pick / predict_output, wrong answer → **replay-at-step deep link** —
  the docs/04 journey-2 signature move), `<Callout/>` (Insight/Warning/Try-it).
- ✅ `@algolens/content`: typed curriculum manifest + 3 exemplar lessons (Big-O, Binary Search,
  BFS) locking the template; invariant tests (quizCount matches MDX, algos registered, no raw
  script/iframe, sub-1200-word budget, prerequisite integrity).
- ✅ Lesson reader (docs/05 §5.5): 68ch prose column, sticky scroll-progress bar, track outline
  with completion ticks, completion = scroll ≥ 90% + all quizzes passed → +XP completion card,
  next-lesson CTA. `/learn` catalog + track overview with prerequisite locks.
- ✅ Dashboard: real continue-learning card + XP total (device-local).
- ✅ API: GET /api/v1/tracks, GET /api/v1/lessons/:slug (Zod-validated responses); progress PUT +
  quiz-attempts POST validate and return 501 problem+json pending auth+DB (**ADR-0003**).
- ⛔️ Deferred: server-side progress (needs Auth.js + Postgres), remaining ~22 Foundations
  lessons (content sprint), Playwright e2e for PRD story #2, search indexing checks.

### Phase 3 — Complexity Lab (core complete)

- ✅ `@algolens/complexity` static layer: Babel-AST walker — loop classification (counter → n,
  geometric → log n, triangular → n², constant → 1), bisection/halving detection, known-call
  cost table, recursion → recurrence (Master theorem / summation / exponential branching with
  per-path call counting so guard-style recursion classifies correctly). **Honesty contract:**
  unrecognized constructs (Collatz-style loops, unknown calls, odd recursion) land in
  `unresolved[]` and lower confidence — asserted by tests, never guessed away.
- ✅ **50-function golden benchmark in CI, gated at ≥90%** (currently 100%); twoSum→O(n²) HIGH
  confidence and naive-fib→O(2ⁿ) asserted explicitly (phase acceptance).
- ✅ Empirical layer: geometric n schedule, median-of-reps, **op counting via Proxy-instrumented
  arrays (noise-free, preferred) + wall-time fallback**, closed-form least-squares fit over the
  7 candidate classes with R² + runner-up, 10s adaptive budget whose projection-based early bail
  doubles as the exponential signal (naive fib bails in seconds, asserted).
- ✅ Verdict merge (§5.4): agree → high confidence; disagree → divergence card with both chips +
  likely reasons (worst-case vs input-family, near-tie fits, partial static).
- ✅ `/analyze` UI: editor + generator preset chips, **bench Web Worker** (user code never touches
  the main thread — rule 5; cancel + 20s terminate guard), streaming per-n progress, verdict /
  divergence cards, annotated source gutter, log-log SVG growth chart with fitted overlays,
  "likely exponential" callout, parse-error path (empirical still runs).
- ✅ `complexity_analyses` Drizzle table; `POST /api/v1/analyses` validates → 501 per ADR-0003.
- ⛔️ Deferred: Monaco editor (styled textarea for now — avoids runtime CDN dependency; swap is
  isolated to one component), AI layer (C5, P1), persistence + Redis rate limits (needs infra),
  Pyodide/Python (C7).

### Phase 4 — Practice pillar (core complete; security-critical parts tested)

- ✅ **Malicious-submission suite written FIRST and green**: infinite loop→TLE, fork/spawn→RE
  (no shell output), fs read→RE (no file contents), network→RE, ~100MB stdout→bounded excerpt,
  deep recursion→RE, memory bomb→contained, parent env canary never leaks (clean child env +
  no host objects cross the vm boundary), syntax garbage→CE.
- ✅ JS judge v1 (`apps/worker/src/judge`): fresh child process per case with `--permission`
  (fs/child_process/workers denied) + 128MB heap cap + in-context console shim + vm timeout +
  parent SIGKILL watchdog + output caps; verdicts AC/WA/TLE/MLE/RE/CE; normalized comparison.
- ✅ **15 problems** authored, linked to lessons (lessons link back via practiceSlug); every
  reference solution is judge-verified against its authored expected outputs in CI.
- ✅ Submission flow: POST /api/v1/submissions (Zod + idempotency key) → in-memory store
  (ADR-0004) → direct judge → **SSE per-case ticks** with snapshot-on-connect reconnect safety.
- ✅ **Hidden-case leak tests** (rule 6 acceptance): problem payloads grepped for every hidden
  input/expected; submission views redact hidden-case output to verdict-only (echo-attack test).
- ✅ Workspace UI (docs/05 §5.6): statement/submissions tabs, editor, client-side sample runs in
  the exec-worker (5s kill), live per-case tick row, verdict card, AC → solved + "Check its
  complexity →" code handoff into the Lab.
- ⛔️ Deferred: Judge0 CE on isolated VM (TRD §7 — explicitly a separate provisioning session),
  Python, editorials content, DB-backed submissions + rate limits, Playwright e2e for story #4.

## Next (not built yet)

- **Polish:** Playwright e2e (PRD stories #1–#4), axe-core CI, Canvas renderer >300 elements,
  run-your-own-code mode (A8), content sprint to 25 lessons, Monaco swap, editorials.
- **Phase 5 — Retention:** SM-2 reviews, streaks/badges, share OG images.
- **Phase 6 — Hardening:** security/perf/ops passes; Judge0 CE provisioning.

See [adr/](./adr) for decisions: [0001-stack](./adr/0001-stack.md),
[0002-step-vocabulary](./adr/0002-step-vocabulary.md),
[0003-client-side-progress](./adr/0003-client-side-progress.md),
[0004-direct-judge-in-memory-submissions](./adr/0004-direct-judge-in-memory-submissions.md).
