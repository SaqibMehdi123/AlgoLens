# Build status

Tracks progress against the implementation roadmap (private planning docs).

## Done

### Phase 0 — Foundation (partial)

- ✅ pnpm + Turborepo monorepo, TRD §3 layout, TS strict (+ `noUncheckedIndexedAccess`).
- ✅ Design tokens (docs/05 §2) as Tailwind v4 `@theme` + CSS variables; dark default, `.light` class.
- ✅ shadcn-style `packages/ui` primitives (Button, Card, `cn`).
- ✅ `packages/db`: Drizzle schema for identity + curriculum + visualize domains; drizzle-kit config; seed.
- ✅ `packages/api-contracts`: Zod schemas (problem+json, pagination, visualize configs).
- ✅ `/api/v1/health` route; `infra/docker-compose.dev.yml` (postgres + redis); GitHub Actions CI.
- ✅ Auth.js v5 wired (GitHub + Google, JWT sessions, custom adapter) — see the dated section below.
- ⛔️ Not yet: Sentry/PostHog init, Neon/Vercel deploy, role-gated middleware, durable persistence.

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
- ✅ `@algolens/content`: typed curriculum manifest + **9 lessons** (Big-O; Linear & Binary Search;
  Selection/Insertion/Merge/Quick sort; BFS & DFS) following the locked template; invariant tests
  (quizCount matches MDX, algos registered, no raw script/iframe, sub-1200-word budget, prerequisite
  integrity). See the dated content section below.
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

### Phase 5 — Retention layer (core complete)

- ✅ `@algolens/retention` (pure, zero-dep, golden-tested): **SM-2 scheduler** (canonical EF deltas,
  interval 1→6→16→45, lapse reset, interval previews, due queue); **timezone-correct streaks** —
  `computeStreak` buckets by local calendar date, with a test proving the **Karachi UTC+5 edge**
  (two studies in one local day spanning two UTC days count as one); **XP ledger + quadratic level
  curve**; **data-driven badge evaluator**.
- ✅ Device-local retention store (ADR-0005): `xp_events` ledger as source of truth (lesson XP
  moved here from the progress store), SM-2 cards, solved set, review logs. Cards auto-created on
  lesson completion (curated key facts in the manifest) + on the exact missed quiz.
- ✅ `/review` meditative flow (docs/05 §5.7): single card, tap/space reveal, four grade buttons
  with SM-2 interval previews, keyboard (space + 1–4), session-progress bar, summary screen,
  teaching empty-state.
- ✅ Dashboard (docs/05 §5.2): streak flame, XP/level ring, due-reviews card, GitHub-style activity
  heatmap, continue-learning. `/profile` (docs/05 §5.8): stat tiles, heatmap, badge shelf.
  Nav gains a Review icon with a live due-count badge.
- ✅ Per-algorithm + per-lesson **OpenGraph images via next/og (satori)** (X5). Renders on
  Linux/CI/Vercel; 500s only on local Windows when the install path contains spaces (a known
  @vercel/og asset-URL bug — does not affect page rendering; see apps/web/src/lib/og-font.ts).
- ✅ DB tables review_cards/review_logs/user_stats/xp_events/badges/user_badges (docs/03 §6–§7);
  review/stats/badges contracts; grade + due routes validate → 501.
- ⛔️ Deferred: streak-freeze BullMQ cron, cross-device sync (auth+DB), `/s/:slug` short-link share
  pages with stored snapshots (needs DB), email digest (Resend), onboarding goal-picker.

### Phase 6 — Production hardening (audit pass complete)

- ✅ **Security:** CSP + full header set (HSTS, nosniff, X-Frame-Options, Referrer/Permissions-Policy)
  via next.config — **verified live**; sliding-window **rate limiting** (submissions 6/min, analyses
  10/min) → 429 problem+json + Retry-After (unit-tested + verified live: 6×202 then 429); malicious
  judge suite re-run green; hidden-case leak tests green.
- ✅ **Dependency audit + fixes:** 29 vulns (2 critical, 12 high) → **4 (0 critical)** by bumping
  next→15.5, postcss→8.5.10, drizzle→0.45.2; remaining 4 documented as accepted-risk (trusted-MDX
  RCE class + next's bundled postcss).
- ✅ **Performance:** **production build green** — 48 pages, shared First-Load JS 105 kB, every route
  < 200 kB (TRD §9 budget met); SSG/ISR for SEO surfaces; workers lazy.
- ✅ **Ops:** [runbook](../infra/runbook.md) (queue stuck / judge down / DB restore),
  [alert rules](../infra/alerts.md) (queue age >60s, error >2%, uptime), and a
  [backup-restore drill script](../infra/backup-restore.sh).
- ✅ Findings report: [docs/06-hardening-report.md](./06-hardening-report.md).
- ⛔️ Deferred to deploy time: Lighthouse run (needs headless Chrome), pg_stat_statements index
  review (needs live DB), Judge0 CE VM provisioning (separate session per TRD §7), object-level
  authz (with Auth.js).

### Practice — LeetCode-style "implement a function", multi-language (this iteration)

- ✅ Problems rebuilt to **implement-a-function** format with a type-DSL signature; **5-language
  starter stubs (JS/TS/Python/C++/Java) auto-generated** from the signature (no hand-written stubs).
- ✅ Problem set expanded to **32** across arrays/strings/searching/hashing/sorting/math/DP/two-
  pointers and intro→medium difficulty. Every JS reference is judge-verified against its cases (CI).
- ✅ Judge rewritten to the **function-call harness**: defines the function, calls it per case with
  structured args, compares the return value (exact / unordered). Args cross the sandbox boundary
  as a JSON string and are re-parsed inside — closing the host-object vm-escape vector. **TypeScript
  judged** (transpiled). Malicious suite re-expressed and green (10/10); all 32 references pass.
- ✅ Workspace: **language selector** + per-language code buffers + signature header; client sample
  runs (JS) via the exec-worker function harness; submit JS/TS → judged (verified live: Two Sum →
  Accepted 5/5 over SSE). **C++/Java/Python → honest 501** pointing at the Judge0 host (verified).
- ✅ Hidden-case leak tests updated for structured cases (grep every payload; submission redaction).
- ⛔️ Deferred (as you noted): real **C++/Java/Python execution** (Judge0 VM, TRD §7) and **Pyodide**
  for in-browser Python sample runs.

### Lesson MDX dev fix — DONE

- ✅ Lessons now render in **`next dev` and the production build**. Root cause was the
  next-mdx-remote × Next-15.5 (React 19) `jsxDEV` mismatch. Fix: compile lesson MDX with
  `@mdx-js/mdx` `evaluate`, passing the **production** JSX runtime (`react/jsx-runtime`) +
  `development:false` explicitly, so dev uses `jsx` (not `jsxDEV`). next-mdx-remote was removed
  entirely (practice statements use `react-markdown`), which also dropped its audit advisories.

### Database live + Auth.js + content sprint (2026-06-16)

- ✅ **Postgres + Redis up** (docker compose) and the schema **migrated + seeded** against a real DB:
  initial migration `0000` generated, with `CREATE EXTENSION pgcrypto/citext` prepended (needed by
  `gen_random_uuid()` + `citext` columns) before first apply. 22 tables created; 12 visualizations
  seeded. `drizzle.config.ts` + `seed.ts` now auto-load the repo-root `.env` via Node 22
  `process.loadEnvFile`, so `db:migrate`/`db:seed` work with no manual exports (no-op in CI/deploy).
- ✅ **Auth.js v5 (GitHub + Google)** — `next-auth@5` with a **custom Drizzle adapter** mapping onto
  our bespoke `citext` `users`/`auth_accounts` schema (the stock `@auth/drizzle-adapter` shape
  doesn't fit) and **JWT sessions** carrying `id` + `role` (**ADR-0006**). Adds
  `/api/auth/[...nextauth]`, a `/login` page (server-action `signIn`/`signOut`, providers gated on
  env), and session/JWT/AdapterUser type augmentation. `next.config.mjs` loads the repo-root `.env`
  so the Next server sees `AUTH_*`/`DATABASE_URL` and transpiles `@algolens/db`. **Verified:**
  apps/web typecheck clean; `/api/auth/providers` → github+google with correct callback URLs;
  `/login` renders both buttons (200). Browser OAuth consent is the only user-side step left.
- ✅ **+6 lessons** (Linear/Selection/Insertion/Merge/Quick sort, DFS) → DSA Foundations is now **9
  lessons** across Complexity / Searching / **Sorting** (new module) / Graph Traversal. Each adds an
  "In interviews & contests" section and cited "Sources & further reading" (CLRS, Sedgewick & Wayne,
  Competitive Programmer's Handbook, cp-algorithms, CTCI); predict_output quizzes use engine-faithful
  traces. New `apps/web check:mdx` compiles every lesson through the production MDX pipeline (9/9 ok).

## Next (post-launch backlog)

- **Polish:** Playwright e2e (PRD stories #1–#5), axe-core CI, Canvas renderer >300 elements,
  run-your-own-code mode (A8), content sprint to 25 lessons, Monaco swap, editorials.
- **P1 features:** AI explanation layer (C5), Python/Pyodide (B7/C7), share `/s/:slug` pages,
  streak-freeze cron, email digest, **Judge0 host for C++/Java/Python submissions**.
- **Launch:** Lighthouse in CI, deploy (Vercel + worker VM + Neon + Redis), engineering blog post
  on the trace engine + Complexity Lab.

See [adr/](./adr) for decisions: [0001-stack](./adr/0001-stack.md),
[0002-step-vocabulary](./adr/0002-step-vocabulary.md),
[0003-client-side-progress](./adr/0003-client-side-progress.md),
[0004-direct-judge-in-memory-submissions](./adr/0004-direct-judge-in-memory-submissions.md),
[0005-retention-domain-package](./adr/0005-retention-domain-package.md),
[0006-jwt-sessions-custom-adapter](./adr/0006-jwt-sessions-custom-adapter.md).
