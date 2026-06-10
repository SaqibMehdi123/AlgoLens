# ADR 0001 — Stack & monorepo foundation

**Status:** Accepted · **Date:** 2026-06-10

## Context

AlgoLens needs SSR/ISR for SEO'd lessons and visualizer pages, a client-heavy interactive
player, a pure and trivially-testable algorithm core, and a server worker for sandboxed judging.
The TRD (§2–§3) fixes the stack; this ADR records it and the one mechanical decision left open.

## Decision

- **Monorepo:** pnpm workspaces + Turborepo, layout per TRD §3.
- **Packages are "just-in-time" / internal:** each `packages/*` exports TypeScript source directly
  (`"exports": "./src/index.ts"`) with **no build step**. The Next.js app transpiles them via
  `transpilePackages`; Vitest and `tsc` consume the source. This keeps `algo-core` dependency-free
  and the edit→test loop instant, at the cost of consumers needing a bundler/transpiler (all do).
- **App:** Next.js 15 App Router, React 19, TypeScript strict (+ `noUncheckedIndexedAccess`).
- **Styling:** Tailwind CSS v4 with the design tokens from docs/05 §2 expressed as CSS variables in
  an `@theme` block; dark is the default theme, light via a `.light` class. shadcn-style primitives
  are authored by hand in `packages/ui` (Radix + cva) rather than via the CLI, for full token control.
- **State:** Zustand for the player/editor machine; TanStack Query for server cache.
- **Data:** Drizzle ORM + PostgreSQL 16, schema translated 1:1 from docs/03; forward-only migrations.
- **Validation:** Zod at every boundary, shared via `packages/api-contracts`.

## Consequences

- `algo-core` stays portable (web, workers, future native) and ~100% unit-testable with golden traces.
- No per-package `dist/` to keep in sync; `turbo build` only builds the apps.
- Tailwind v4's `@theme` makes the semantic visualization palette first-class utilities
  (`bg-compare`, `text-swap`, …) with fixed meanings everywhere, satisfying the design contract.
