/**
 * XP ledger + level curve. `xp_events` is the append-only source of truth; total XP, level, and
 * streak are projections over it (docs/03 note 1). Pure — the projection is a fold.
 */
export type XpReason =
  | "lesson_completed"
  | "problem_solved"
  | "review_completed"
  | "quiz_correct"
  | "streak_extended";

export interface XpEvent {
  amount: number;
  reason: XpReason;
  /** Entity that earned it (lesson slug, problem slug, card id…). */
  refId?: string;
  at: number;
}

export const XP_AWARDS = {
  lesson_completed: 50,
  problem_solved: { intro: 20, easy: 30, medium: 50, hard: 80 },
  review_completed: 5,
  quiz_correct: 5,
  streak_extended: 10,
} as const;

export function totalXp(events: XpEvent[]): number {
  return events.reduce((sum, e) => sum + e.amount, 0);
}

/** Cumulative XP required to reach the START of `level` (level 1 = 0). Quadratic curve. */
export function xpForLevel(level: number): number {
  const n = Math.max(0, level - 1);
  return (100 * (n * (n + 1))) / 2;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  return level;
}

export interface LevelInfo {
  level: number;
  xpTotal: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  /** Fraction toward the next level, 0..1. */
  progress: number;
}

export function levelInfo(xp: number): LevelInfo {
  const level = levelForXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const span = ceil - floor;
  const into = xp - floor;
  return {
    level,
    xpTotal: xp,
    xpIntoLevel: into,
    xpForNextLevel: ceil - xp,
    progress: span === 0 ? 0 : into / span,
  };
}
