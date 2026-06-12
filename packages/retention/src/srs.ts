/**
 * SM-2 spaced-repetition scheduler (SuperMemo 2, Wozniak 1990) — pure and deterministic.
 *
 * Convention (the dominant JS implementation, documented so the golden tests are unambiguous):
 *   1. quality q ∈ [0,5].
 *   2. if q ≥ 3:  rep0 → I=1; rep1 → I=6; else I = round(prevInterval × prevEF). rep++.
 *      else:      rep = 0; I = 1.   (lapse: relearn from the start)
 *   3. EF' = EF + (0.1 − (5−q)(0.08 + (5−q)·0.02)), clamped to ≥ 1.3, updated on EVERY grade.
 *      The new interval uses the *previous* EF; the new EF affects the next review.
 *
 * Grade mapping (app-flow §7): Again/Hard/Good/Easy → 1 / 3 / 4 / 5.
 */
export const MIN_EASE_FACTOR = 1.3;
export const DEFAULT_EASE_FACTOR = 2.5;
const MS_PER_DAY = 86_400_000;

export type ReviewGrade = "again" | "hard" | "good" | "easy";

export const GRADE_QUALITY: Record<ReviewGrade, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

/** The mutable SM-2 state stored per card (mirrors review_cards in docs/03 §6). */
export interface SrsState {
  easeFactor: number;
  /** Days until the next review. */
  intervalDays: number;
  repetitions: number;
}

export interface ScheduleResult extends SrsState {
  /** Absolute due time = reviewedAt + intervalDays. */
  dueAt: number;
}

export function initialSrsState(): SrsState {
  return { easeFactor: DEFAULT_EASE_FACTOR, intervalDays: 0, repetitions: 0 };
}

/** The EF delta for a quality grade — the canonical, unambiguous part of SM-2. */
export function easeDelta(quality: number): number {
  const d = 5 - quality;
  return 0.1 - d * (0.08 + d * 0.02);
}

export function nextEaseFactor(easeFactor: number, quality: number): number {
  return Math.max(MIN_EASE_FACTOR, easeFactor + easeDelta(quality));
}

/**
 * Apply one review. Returns the new SM-2 state plus the absolute `dueAt`.
 * `reviewedAt` defaults to now; pass it explicitly for deterministic tests.
 */
export function schedule(
  state: SrsState,
  grade: ReviewGrade | number,
  reviewedAt: number = Date.now(),
): ScheduleResult {
  const quality = typeof grade === "number" ? grade : GRADE_QUALITY[grade];
  const correct = quality >= 3;

  let intervalDays: number;
  let repetitions: number;
  if (correct) {
    if (state.repetitions === 0) intervalDays = 1;
    else if (state.repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(state.intervalDays * state.easeFactor);
    repetitions = state.repetitions + 1;
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  const easeFactor = nextEaseFactor(state.easeFactor, quality);
  return {
    easeFactor,
    intervalDays,
    repetitions,
    dueAt: reviewedAt + intervalDays * MS_PER_DAY,
  };
}

/** Preview the interval each grade would produce — powers the "Good · 3d" button labels (§5.7). */
export function intervalPreview(state: SrsState): Record<ReviewGrade, number> {
  const grades: ReviewGrade[] = ["again", "hard", "good", "easy"];
  const out = {} as Record<ReviewGrade, number>;
  for (const g of grades) out[g] = schedule(state, g, 0).intervalDays;
  return out;
}

/** Cards whose dueAt is at or before `now`, soonest first (the due queue). */
export function dueCards<T extends { dueAt: number; suspended?: boolean }>(
  cards: T[],
  now: number = Date.now(),
): T[] {
  return cards
    .filter((c) => !c.suspended && c.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt);
}
