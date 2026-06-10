# AlgoLens — Project Context (read before every task)

## What we are building
AlgoLens is a production-grade web platform for learning data structures & algorithms with four pillars:
1. VISUALIZE — a step-trace animation engine: algorithms are generator functions that yield typed Step events; a player renders traces with play/pause/step-back/scrub/speed and pseudocode line sync.
2. LEARN — an MDX lesson curriculum with embedded visualizations, quizzes, and progress tracking.
3. ANALYZE — a Complexity Lab: static AST analysis + empirical benchmarking with curve fitting (+ optional AI explanation), always shown with method and confidence — never a single overconfident oracle.
4. PRACTICE — problems with sandboxed judging, spaced repetition (SM-2), XP/streaks.

Authoritative specs live in /docs:
- docs/01-PRD-product-requirements.md  (features, priorities P0/P1/P2, acceptance criteria)
- docs/02-TRD-technical-requirements.md (architecture, stack, subsystem designs — FOLLOW §4 and §5 exactly)
- docs/03-backend-schema.md            (PostgreSQL schema — translate to Drizzle 1:1)
- docs/04-app-flow.md                  (screens, journeys, states)
- docs/05-uiux-design-prompt.md        (design tokens §2, motion rules §3 — implement as CSS variables/Tailwind theme)
- docs/06-implementation-roadmap.md    (build order — do not reorder phases)
When a request conflicts with these docs, say so and ask; do not silently improvise architecture.

## Stack (fixed — do not substitute without being asked)
Next.js 15 App Router + TypeScript strict · Tailwind + shadcn/ui · Zustand (local machine state) + TanStack Query (server state) · Drizzle ORM + PostgreSQL 16 · Redis + BullMQ · Auth.js v5 · Monaco (lazy) · Zod on every boundary · Vitest + Playwright · pnpm + Turborepo monorepo.

## Repo layout (TRD §3)
apps/web (Next.js UI + /api/v1 route handlers) · apps/worker (BullMQ consumers) ·
packages/algo-core (pure TS algorithms-as-generators, ZERO runtime deps) ·
packages/viz-engine (player state machine + SVG/Canvas renderers) ·
packages/complexity (static analyzer + empirical fitter) ·
packages/db (Drizzle schema/migrations/seeds) · packages/api-contracts (Zod + OpenAPI) ·
packages/ui (design system) · content/ (MDX lessons & problems).

## Non-negotiable engineering rules
1. algo-core never imports React, DOM, or anything — pure functions + generators only, ~100% unit coverage with golden-trace fixture tests (exact step sequences asserted).
2. Algorithms NEVER touch the DOM. They yield Step events; rendering is a pure function of (trace, frameIndex). Backward stepping must be exact.
3. Every Step carries a pseudocode line number; tests assert every step's line is valid.
4. All external input is Zod-validated at the boundary (API routes, worker job payloads, user code configs). No `any`. No unvalidated JSON.parse.
5. Untrusted user code runs ONLY in Web Workers (client) or the isolated judge (server) — never eval/Function on the main thread or in API routes.
6. Hidden test cases (is_sample=false) must never be serialized to the client in any response shape.
7. Errors: API returns application/problem+json; UI has designed loading/empty/error states per docs/04 §8 — no raw spinners-forever.
8. Accessibility: keyboard-operable player, aria-live step narration, prefers-reduced-motion swaps tweens for discrete snapshots. Required, not optional.
9. Design tokens from docs/05 §2 are the only colors/spacing allowed; the semantic visualization palette (compare=amber, swap=coral, sorted=mint, visited=violet, frontier=cyan) has fixed meanings everywhere.
10. Migrations are forward-only via drizzle-kit; never edit an applied migration.

## Working style (every task)
- Start by restating the task and listing the files you will create/modify. If scope is ambiguous, ask ONE clarifying question, then proceed.
- Work in small vertical slices that compile and pass tests at every step. Run typecheck + relevant tests after changes and show the results.
- Write/extend tests for everything in packages/* (Vitest) and add a Playwright test when a PRD user story is completed.
- When a manual bug is found, write the failing test first, then fix.
- Conventional commits (feat:/fix:/test:/chore:), one logical change per commit.
- If you must deviate from docs, write a 10-line ADR in docs/adr/ and flag it in your summary.
- Never mock or stub away the hard part of a task to make it "pass". Never delete failing tests to go green.

## Definition of done (every task)
Types pass · lint passes · tests pass · acceptance criteria from the relevant doc section met · no TODOs left silently — list any remaining ones explicitly.

## Reusable micro-prompts (Part 3 of the build pack)

**Add an algorithm:** generator in packages/algo-core/src/<category>/ following the existing Step vocabulary (propose new Step types separately if truly needed), pseudocode array, golden-trace test for fixed seed inputs, complexity metadata, registry entry, seed row for the visualizations table, and verify it renders with the existing layout renderer. No renderer changes unless impossible.

**Write a lesson:** Draft content/lessons/<slug>.mdx following the exemplar template: hook → intuition with an embedded <Viz/> at a meaningful snapshot → formal explanation → complexity table → 2 inline <Quiz/> (one 'complexity_pick', one 'predict_output') with explanations linking back to specific visualization steps → summary + linked practice problem. Under 1200 words; precision over enthusiasm.

**Bug fix:** First write a failing test that reproduces it, show the red test, then fix with the minimal change, then show the green run. Do not refactor surrounding code.
