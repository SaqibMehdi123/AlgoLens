# ADR 0005 — Pure retention package + device-local ledger

**Status:** Accepted · **Date:** 2026-06-11

## Context

Phase 5 needs SM-2 scheduling, streaks (timezone-correct), an XP ledger with a level projection,
and a badge evaluator. The acceptance criteria are explicitly unit tests: SM-2 against the
canonical examples, and streaks surviving the Karachi (UTC+5) edge. Persistence and the
streak-freeze cron need Postgres + BullMQ, which aren't provisioned here.

## Decision

1. **All retention logic is a pure, zero-dependency package** (`@algolens/retention`): SM-2
   (`schedule`, `intervalPreview`, `dueCards`), streaks (`dayKey`, `computeStreak` — buckets by
   the user's *local* calendar date), XP (`totalXp`, `levelForXp`, `levelInfo`), and a data-driven
   badge evaluator. It is golden-tested (canonical EF deltas −0.8…+0.1, interval 1→6→16→45,
   the Karachi timezone edge, level curve, badge thresholds) — the same purity discipline as
   `algo-core` and `complexity`.
2. **`xp_events` is the source of truth; XP/level/streak are folds over it** (docs/03 note 1).
   The web app keeps the ledger + SM-2 cards + solved set in one device-local store whose shapes
   match the API contracts. Lesson XP moved out of the progress store into this ledger.
3. **Cards are auto-created** on lesson completion (curated key facts in the lesson manifest) and
   on the exact quiz a learner misses (app-flow journey 6). New cards enter the queue immediately;
   grading Good/Easy schedules the next review per SM-2 (≈ "due tomorrow" after the first review).
4. The DB tables (review_cards, review_logs, user_stats, xp_events, badges, user_badges) and the
   review/stats/badges contracts exist now; the grade/due routes validate and return 501.

## Consequences

- The full retention loop (complete a lesson → cards due → /review → streak/XP/badges) works
  today, anonymously. Streaks are correct across timezones because bucketing is local-date based.
- The streak-freeze cron and cross-device sync arrive with the worker queue + auth; swapping the
  store's transport (localStorage → fetch) is the only change — the pure scheduler is unaffected.
