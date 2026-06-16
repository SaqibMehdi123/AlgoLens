# ADR 0006 — JWT sessions + a custom Auth.js adapter (not stock Drizzle adapter / DB sessions)

**Status:** Accepted · **Date:** 2026-06-16

## Context

SETUP.md §3c sketched Auth.js as `DrizzleAdapter(db())` with `session: { strategy: "database" }`.
But our identity schema (docs/03 §1, implemented in `@algolens/db`) is intentionally bespoke and
does **not** match what `@auth/drizzle-adapter` requires:

- `users` has `citext` `email`, a required unique `username`, `role`, and `email_verified_at` —
  not the adapter's `name` / `image` / `emailVerified` shape (and it has no `name`/`image` columns).
- `auth_accounts` stores a timestamp `expires_at`; the adapter expects an integer (unix seconds)
  plus `type`/`token_type`/`scope`/`id_token`/`session_state` columns we don't carry.
- `sessions` is `token_hash`-shaped (our own opaque-token design), not the adapter's `session_token`.
- There is no `verification_tokens` table (no magic-link provider is enabled yet).

Reshaping the schema to the stock adapter would mean editing applied migrations and abandoning the
docs/03 design. Database sessions would also require the Node-only Postgres client inside edge
middleware.

## Decision

1. **Custom adapter** (`apps/web/src/auth-adapter.ts`) implementing only the methods OAuth needs —
   `createUser` (allocates a unique `username` from the email local-part), `getUser`,
   `getUserByEmail`, `getUserByAccount`, `updateUser`, `linkAccount`, `unlinkAccount`, `deleteUser`
   — mapped onto our real `users` / `auth_accounts` columns.
2. **`session: { strategy: "jwt" }`.** Identity + `role` ride in the signed token (`jwt`/`session`
   callbacks), so no per-request session read and no DB in edge contexts. Session/verification-token
   adapter methods are intentionally omitted — Auth.js never calls them under JWT.
3. **GitHub + Google**, each enabled only when its `AUTH_*` env vars are present, so the app builds
   and boots without OAuth configured.

## Consequences

- OAuth sign-in persists a real `users` row (+ `auth_accounts`) that domain tables can FK to, which
  unblocks durable persistence (§4 / ADR-0003 transport swap) without a schema rewrite.
- Our bespoke `sessions` table stays available for any future opaque-token/server-revocation needs;
  it is simply not used by Auth.js while we're on JWT.
- Switching to DB sessions later means adding the adapter's session methods + a `verification_tokens`
  table via a new forward-only migration — a contained change, not a rewrite.
- Magic-link email is deferred (no `verification_tokens` yet); adding it is the same contained step.
