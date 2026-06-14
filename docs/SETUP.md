# AlgoLens — Setup & Deployment

Exact, copy-pasteable steps. Sections are ordered by how much they require from you:
**§1 runs with zero setup**; **§2** adds a database; **§3–§7** enable the pieces that need
your accounts/secrets/servers. Where something isn't wired into the code yet, it's marked
**(planned wiring)** with the precise hook points so it's a small, well-scoped change.

> What works **today with no services**: Visualize, Complexity Lab, Learn (lessons + quizzes),
> Practice (JS/TS judged in an isolated sandbox), and Retention (SM-2/streaks/XP) — all persisted
> **on-device** (localStorage) per ADR-0003/0004/0005. The sections below make it multi-user,
> durable, and multi-language.

---

## §1 — Run locally (no setup)

**Prerequisites:** Node ≥ 20.11 (22 recommended), pnpm 9, git. (`corepack enable` gives you pnpm.)

```bash
git clone https://github.com/SaqibMehdi123/AlgoLens.git
cd AlgoLens
pnpm install
pnpm dev                 # http://localhost:3000
```

Useful checks:

```bash
pnpm typecheck           # tsc --noEmit across all packages
pnpm test                # vitest (golden traces, judge + malicious suite, SM-2, …)
pnpm build               # production build (Next + all packages)
pnpm --filter @algolens/web start   # serve the production build
```

---

## §2 — Add a database (Postgres) + Redis

Brings up real services locally. The Drizzle schema, migrations generator, and seed already exist.

**1. Start Postgres + Redis** (Docker):

```bash
docker compose -f infra/docker-compose.dev.yml up -d
# postgres → localhost:5432 (algolens/algolens/algolens), redis → localhost:6379
```

**2. Create `.env`** at the repo root (copy `.env.example`):

```bash
cp .env.example .env
```

Minimum for the DB:

```ini
DATABASE_URL=postgresql://algolens:algolens@localhost:5432/algolens
REDIS_URL=redis://localhost:6379
```

**3. Generate + run migrations, then seed the visualization catalog:**

```bash
pnpm --filter @algolens/db db:generate   # drizzle-kit: SQL from schema.ts → packages/db/drizzle/
pnpm --filter @algolens/db db:migrate     # apply migrations (forward-only)
pnpm --filter @algolens/db db:seed        # upsert the 12 visualizations from the algo-core registry
```

Verify: `docker exec -it algolens-postgres psql -U algolens -c "\dt"` lists the tables;
`select count(*) from visualizations;` returns 12.

> The app's reads/writes are **device-local today**; wiring them to this DB is §4.

---

## §3 — Auth.js v5 (GitHub + Google + magic link)  **(planned wiring)**

Accounts make progress/submissions/reviews roam across devices. The DB schema for
`users / auth_accounts / sessions / user_settings` already exists (docs/03 §1).

### 3a. Create the OAuth apps (do this once)

**GitHub:**
1. https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**.
2. Application name: `AlgoLens (dev)`. Homepage URL: `http://localhost:3000`.
3. **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`.
4. Register → copy **Client ID**; **Generate a new client secret** → copy it.

**Google:**
1. https://console.cloud.google.com/ → create/select a project.
2. **APIs & Services → OAuth consent screen** → External → fill app name + your email → save.
3. **Credentials → Create credentials → OAuth client ID → Web application**.
4. **Authorized redirect URI:** `http://localhost:3000/api/auth/callback/google` → Create.
5. Copy **Client ID** and **Client secret**.

### 3b. Secrets into `.env`

```ini
AUTH_SECRET=<run: npx auth secret>
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
# magic link (optional) — Resend or SMTP:
AUTH_EMAIL_SERVER=smtp://user:pass@smtp.host:587
AUTH_EMAIL_FROM="AlgoLens <login@yourdomain>"
```

### 3c. Wire it (the code change)

1. `pnpm --filter @algolens/web add next-auth@beta @auth/drizzle-adapter`.
2. Add `apps/web/src/auth.ts` exporting `NextAuth({ adapter: DrizzleAdapter(db()), providers: [GitHub, Google, Email], session: { strategy: "database" } })`.
3. Add the route handler `apps/web/src/app/api/auth/[...nextauth]/route.ts` → `export { GET, POST } from "@/auth"`.
4. Gate `/dashboard` and author/admin routes in `middleware.ts` via the session; add role checks.
5. Swap the device-local stores (`@/lib/progress`, `@/lib/retention`) to call the now-live
   `PUT /api/v1/progress/...`, `POST /api/v1/quiz-attempts`, `POST /api/v1/reviews/:id/grade`
   (they currently return `501`; ADR-0003). A claim-on-signup job migrates device data.

---

## §4 — Durable persistence (replace device-local stores)  **(planned wiring)**

Once §2 + §3 are live, switch the API routes from `501` to real Drizzle reads/writes:

- `progress/lessons/[slug]` → upsert `user_lesson_progress`.
- `quiz-attempts` → insert `quiz_attempts`.
- `submissions` → insert `submissions` + `submission_results` (instead of the in-memory store, ADR-0004).
- `reviews/:cardId/grade` → update `review_cards` (SM-2 via `@algolens/retention`) + insert `review_logs`;
  recompute `user_stats` from `xp_events` transactionally.
- `analyses` → insert `complexity_analyses` keyed by `sha256(language+source)`.

The Zod contracts and the SM-2/streak/XP logic are already shared, so each route is a thin mapping.

---

## §5 — Server-side multi-language judging (Judge0 CE)  **(separate host — TRD §7)**

JS/TS are judged in the in-process isolated sandbox today. **C++, Java, Python** need Judge0 on a
**dedicated, network-isolated VM** (never the app host). Provision once:

1. **A separate VM** (Hetzner/Fly), private network only, no public ingress.
2. Install Docker; clone Judge0 CE; in `judge0.conf` set a strong `AUTHN_TOKEN`.
3. **Harden (do not skip):**
   - container egress blocked: `iptables -A DOCKER-USER -j DROP` for outbound from judge containers;
   - cgroup CPU/memory/pids limits; read-only rootfs; **no `--privileged`**; no host mounts;
   - reachable only from the worker over VPC/WireGuard + the auth token.
4. `docker compose up -d` (db + redis + server + workers). Verify `curl -H "X-Auth-Token: …" $JUDGE0_URL/about` works **only** from the worker VM.
5. In the worker, set `JUDGE0_URL` + `JUDGE0_TOKEN`; the submission route already returns a clear
   501 for cpp/java/python — swap that branch to enqueue a BullMQ judge job that calls Judge0 and
   maps statuses → `AC/WA/TLE/MLE/RE/CE`. Re-run the malicious suite after any config change.

Patch cadence: monthly (known historical isolate escapes involved privileged mode / misconfig).

### Pyodide (optional, client-side Python) **(planned)**
For in-browser Python *sample* runs without Judge0: lazy-load Pyodide in a worker. Note: add the
Pyodide CDN to the CSP `script-src`/`connect-src` (or self-host the wasm) — it needs `unsafe-eval`
for wasm, which the CSP already allows. Hidden-case judging still goes through Judge0 (rule 6).

---

## §6 — Observability (Sentry + PostHog)

Both are **behind env flags** — absent keys = disabled, no code change needed.

1. **Sentry:** create a project at sentry.io → copy the **DSN**.
2. **PostHog:** create a project at posthog.com → copy the **Project API key** + host.
3. `.env`:
   ```ini
   NEXT_PUBLIC_SENTRY_DSN=...
   SENTRY_DSN=...
   NEXT_PUBLIC_POSTHOG_KEY=...
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```
4. If you add Sentry, also add `https://*.sentry.io` and your PostHog host to the CSP `connect-src`
   in `apps/web/next.config.mjs`.

---

## §7 — Deploy

**Web (Vercel):**
1. Import the GitHub repo at vercel.com.
2. Root is the monorepo; Vercel auto-detects Next in `apps/web`. Build command `pnpm build`,
   output `apps/web/.next` (Vercel handles Turborepo).
3. Add all `.env` values as Vercel Environment Variables (Production + Preview).
4. Point `metadataBase` (apps/web/src/app/layout.tsx) at your real domain.

**Database:** Neon (or Supabase/RDS). Use a Neon **branch** DB per preview. Run
`pnpm --filter @algolens/db db:migrate` in the deploy pipeline before the app boots
(forward-only). **Redis:** Upstash. **Worker + Judge0:** the isolated VM from §5.

**CI:** `.github/workflows/ci.yml` runs typecheck → lint → test → build on every PR. Add a
Lighthouse step and `pnpm --filter @algolens/db db:migrate` (against the preview branch) before
the preview deploy.

---

## Status of each piece

| Piece | State |
|---|---|
| Visualize / Learn / Lab / Practice(JS,TS) / Retention | ✅ works now (device-local) |
| Postgres schema + migrations + seed | ✅ code exists (§2 to run) |
| Auth.js, durable persistence | 🔧 planned wiring (§3–§4) |
| Judge0 (C++/Java/Python) | 🔧 provision + wire (§5) |
| Sentry / PostHog | ✅ env-flagged (§6 to enable) |
| Deploy | 🔧 your accounts (§7) |

See [STATUS.md](./STATUS.md) for the full build log and [adr/](./adr) for decisions.
