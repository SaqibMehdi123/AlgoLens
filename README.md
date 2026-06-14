# AlgoLens

> See the algorithm. Prove the complexity. Then prove you can write it.

A production-grade platform for learning data structures & algorithms through interactive
visualizations, an honest complexity analyzer, and sandboxed practice problems.

Built as a pnpm + Turborepo monorepo against a fixed PRD/TRD spec pack.
[`CLAUDE.md`](./CLAUDE.md) is the engineering contract every change is held to;
decisions are recorded as ADRs in [`docs/adr/`](./docs/adr).

## The four pillars

| Pillar        | What it is                                                                    |
| ------------- | ----------------------------------------------------------------------------- |
| **Visualize** | A step-trace engine: algorithms are generators that yield typed `Step` events |
| **Learn**     | An MDX curriculum with embedded visualizations, quizzes, and progress         |
| **Analyze**   | A Complexity Lab: static AST analysis + empirical curve-fitting, honestly      |
| **Practice**  | Problems with a sandboxed judge, spaced repetition (SM-2), XP/streaks          |

## Architecture: trace, don't animate

Algorithms never touch the DOM. They emit a serialized **trace** of typed steps; the player
is a pure function `render(trace, frameIndex)`. This one decision buys exact backward stepping,
scrubbing, speed control, shareable URLs, deterministic golden-trace tests, and renderer reuse.

## Repo layout

```
apps/
  web/             Next.js 15 app (UI + /api/v1 route handlers)
  worker/          BullMQ consumers (judge orchestration, AI jobs, OG images)
packages/
  algo-core/       ⭐ Pure TS: algorithms as trace generators + types. Zero runtime deps.
  viz-engine/      Player state machine + SVG/Canvas renderers + layouts
  complexity/      Static AST analyzer + empirical fitter
  db/              Drizzle schema, migrations, seeds
  api-contracts/   Zod schemas + OpenAPI types
  ui/              Design-system components
content/           MDX lessons, problems, editorials
docs/              PRD, TRD, schema, app-flow, UI/UX, roadmap, ADRs
```

## Getting started

```bash
pnpm install
pnpm test         # vitest across all packages (golden-trace fixtures)
pnpm typecheck    # tsc --noEmit across the monorepo
pnpm dev          # boots apps/web on http://localhost:3000
```

Visualize, Learn, the Complexity Lab, Practice (JS/TS), and Retention all work with **no setup**
(state is device-local). To add a database, accounts, multi-language judging, observability, or to
deploy, follow [`docs/SETUP.md`](./docs/SETUP.md) — exact step-by-step.

## Build order

The build follows the implementation roadmap phase by phase: foundation → visualization
engine → Learn → Complexity Lab → Practice → retention → hardening. Current status is
tracked in [`docs/STATUS.md`](./docs/STATUS.md).
