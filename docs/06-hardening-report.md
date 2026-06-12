# Phase 6 — Production-readiness audit & findings

Audit of the current build against TRD §7 (security) and §9–§10 (performance/ops). Each finding
has a severity and a status: **Fixed**, **Mitigated**, or **Accepted** (with rationale). P0/P1
items were fixed in this pass; lower items are tracked.

## Summary

| Area | Before | After |
|---|---|---|
| `pnpm audit` | 29 (2 critical, 12 high, 12 moderate, 3 low) | **4 (0 critical, 3 high, 1 moderate)** |
| Security headers / CSP | none | full set + CSP applied to all routes |
| API rate limiting | none | sliding-window on submissions (6/min) + analyses (10/min) |
| Production build | never run | **green** — 48 pages, shared JS 105 kB, all routes < 200 kB |
| Malicious judge suite | green | **re-run green** (10/10) after config changes |

## Security (OWASP-oriented)

| # | Finding | Sev | Status | Notes |
|---|---|---|---|---|
| S1 | No CSP / security headers | High | **Fixed** | CSP (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `worker-src 'self' blob:`) + HSTS, `nosniff`, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy via `next.config` `headers()`. |
| S2 | `script-src` keeps `'unsafe-eval'` | Med | **Accepted** | Required by the client sandbox workers (Lab/sample runs execute user code via `Function`). The Web Worker — no DOM, no network, terminate-on-timeout — **is** the isolation boundary, so eval there is by design, not stray (TRD §7). |
| S3 | Critical/high dependency advisories | Critical | **Fixed** | `next` → ≥15.5.16 (clears the 2 criticals + most highs), `postcss` (direct) → 8.5.10, `drizzle-orm` → 0.45.2. Typecheck/build/tests all still green. |
| S4 | Unbounded submission/analysis endpoints | High | **Fixed** | Sliding-window rate limiter (`@/lib/rate-limit`, unit-tested) → `429 problem+json` + `Retry-After`. Prod uses a Redis window (same contract). |
| S5 | Untrusted code execution | Critical | **Verified** | Client: Web Workers only, step/time caps, terminate-on-timeout, CSP `worker-src`. Server judge: child process under `--permission` (fs/net/child_process denied) + 128 MB cap + vm timeout + SIGKILL watchdog. Malicious suite (9 attacks) re-run green; canary/env-exfil contained. |
| S6 | Hidden test cases could leak | High | **Verified** | Problem-detail schema has no field for hidden cases; submission views redact hidden output to verdict-only. Leak tests grep every payload (PASS). |
| S7 | Zod on every boundary | — | **Verified** | All mutating routes `safeParse` → 400 with detail; responses dogfood the contracts. |
| S8 | Object-level authz | Med | **Deferred** | No auth yet (ADR-0003); ownership checks land with Auth.js. Anonymous tools carry no PII. |

## Performance (TRD §9)

| # | Finding | Status | Evidence |
|---|---|---|---|
| P1 | Initial route JS < 200 KB | **Pass** | Shared First-Load 105 kB; heaviest routes lesson 135 kB, visualizer 133 kB. |
| P2 | Heavy deps lazy | **Pass** | Workers are dynamic chunks; charts are inline SVG; no Monaco (textarea editor for now). |
| P3 | SSG/ISR for SEO surfaces | **Pass** | Lessons, problems, visualizations prerendered (SSG); catalog ISR (revalidate 3600). |
| P4 | OG images | **Pass (deploy)** | `next/og` routes set `force-dynamic` (generated on-demand). Render on Linux/CI; known `@vercel/og` asset-path bug on local Windows paths with spaces (does not affect page render). |
| P5 | Lighthouse ≥ 90 | **Not run** | No headless Chrome in this environment; bundle budgets (P1) are the proxy. Run in CI before launch. |
| P6 | DB index review (`pg_stat_statements`) | **Deferred** | Hot-path indexes shipped in the schema; review against real query stats once a DB is live. |

## Ops (TRD §10)

| # | Item | Status |
|---|---|---|
| O1 | Runbook (queue stuck / judge down / DB restore) | **Added** — [infra/runbook.md](../infra/runbook.md) |
| O2 | Alert rules (queue age > 60s, error rate > 2%, uptime) | **Added** — [infra/alerts.md](../infra/alerts.md) |
| O3 | Backup + restore drill script | **Added** — [infra/backup-restore.sh](../infra/backup-restore.sh); execute against scratch quarterly |
| O4 | CI gate | **Present** — typecheck → lint → test → build (`.github/workflows/ci.yml`) |

## Remaining accepted risks (the 4 audit findings left)

1. **next-mdx-remote@5 (high)** + its transitive **content (high)** — an MDX-compile RCE class
   advisory. **Accepted:** MDX is repo-authored/trusted content, never user-supplied, so the vector
   doesn't apply. Bump to next-mdx-remote@6 is queued as a separate change (major; would risk the
   verified lesson rendering for no real reduction in *our* attack surface).
2. **postcss@8.4.31 bundled inside `next` (moderate)** — not our direct dependency (`next > postcss`);
   our own postcss is patched to 8.5.10. Cleared when `next` next patches its bundled copy.

These are re-checked every `pnpm audit` run in CI; none are reachable by untrusted input today.
