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

## Next (not built this session)

- **Phase 1 polish:** Playwright e2e for PRD story #1, axe-core CI, Canvas renderer >300 elements,
  run-your-own-code worker mode (A8).
- **Phase 2 — Learn:** MDX pipeline, curriculum migration, lesson reader, 25 lessons.
- **Phase 3 — Complexity Lab:** static analyzer + empirical worker + honesty contract.
- **Phase 4 — Practice:** problem workspace, server judge, malicious-submission suite, Judge0.
- **Phase 5 — Retention:** SM-2 reviews, XP/streaks/badges, share OG images.
- **Phase 6 — Hardening:** security/perf/ops passes.

See [adr/](./adr) for decisions: [0001-stack](./adr/0001-stack.md), [0002-step-vocabulary](./adr/0002-step-vocabulary.md).
