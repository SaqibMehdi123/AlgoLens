# AlgoLens Operations Runbook

On-call playbook for the production incidents that actually happen. Each entry: symptom →
diagnose → mitigate → root-cause. Keep mitigations fast; root-cause after the bleeding stops.

## Service map

- **web** (Vercel or Node/VPS): Next.js app + `/api/v1/*` route handlers + SSE.
- **worker** (Hetzner/Fly VM, private network): BullMQ consumers — judge orchestration, AI, OG.
- **Judge0 CE** (isolated VM, no public ingress): sandboxed execution.
- **Postgres** (Neon/RDS), **Redis** (BullMQ + rate limits).

---

## 1. Judge queue stuck / submissions hang in `queued`

**Symptom:** submissions stay `queued`/`running`; `/practice` SSE never reaches a verdict; queue
age alert (>60s) fires.

**Diagnose**
1. `redis-cli -u $REDIS_URL LLEN bull:judge:wait` — is work piling up?
2. Worker alive? `fly status -a algolens-worker` / `systemctl status algolens-worker`.
3. Judge0 reachable from the worker VM only: `curl -sf $JUDGE0_URL/about` (must fail from public).

**Mitigate**
- Worker down → restart it; BullMQ resumes from Redis (jobs are durable).
- Judge0 down → see §2.
- Poison job wedging a consumer → `BullMQ` drain the active job; it retries with backoff; after
  `attempts` it lands `judge_error` and the user can resubmit (idempotency key dedupes).

**Root-cause:** check worker logs for OOM/timeout loops; confirm `attempts`/`backoff` are set so a
single bad submission can't head-of-line block the queue.

## 2. Judge0 down / every submission → `judge_error`

**Diagnose:** `curl -sf $JUDGE0_URL/workers` from the worker VM; check isolate cgroup limits; check
disk (isolate leaks boxes on crash).
**Mitigate:** restart Judge0 stack (`docker compose restart` on the judge VM). If isolate boxes are
exhausted: `isolate --cleanup` across box ids. Feature-flag submissions to "client samples only"
while down — the workspace still runs sample cases in the exec-worker (no server needed).
**Root-cause:** confirm egress is still DROPped (config drift after a patch can re-open it — re-run
the §7 hardening checklist), cgroup pids/mem limits intact, rootfs read-only.

## 3. Database down / failover

**Diagnose:** `/api/v1/health` degrades; `pg_isready -d $DATABASE_URL`; provider status page.
**Mitigate:** Neon → promote a healthy branch/region; update `DATABASE_URL`, redeploy web+worker.
Anonymous Visualize/Analyze keep working (no DB on those paths). Progress writes queue client-side
and replay on reconnect.
**Restore from backup:** see [backup-restore.sh](./backup-restore.sh). Drill it quarterly.

## 4. Error rate spike (>2%)

**Diagnose:** Sentry → top issue + release; correlate with the last deploy.
**Mitigate:** if it tracks a deploy, **roll back** (Vercel instant rollback / previous worker image)
before debugging. Rate-limit or feature-flag the offending route.
**Root-cause:** add the failing case to the test suite before the fix (working agreement #2).

## 5. Rate-limit / abuse

Limits (TRD §7): submissions 6/min, analyses 10/min, auth 5/min, AI 20/day — Redis sliding window
in prod (`@/lib/rate-limit` is the single-node dev equivalent). A 429 returns `problem+json` +
`Retry-After`. For sustained abuse, block at the edge/WAF by IP or tighten the window.

## 6. LLM spend runaway (AI layer, P1)

Per-user daily cap + global monthly cap with a kill switch (PostHog flag `ai-explanations`). If the
global cap trips, the flag disables the AI layer; deterministic static + empirical results are
unaffected (they never depended on it).

## Deploy / rollback

`main` is always deployable (working agreement #1). CI gate: typecheck → lint → test → build →
preview → migrate (forward-only) → prod. Rollback = redeploy the previous immutable build; never
edit an applied migration — ship a new forward migration.
