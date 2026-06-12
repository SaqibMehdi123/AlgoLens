/**
 * Retention store (ADR-0003/0005): the device-local `xp_events` ledger + SM-2 review cards +
 * solved set. All scoring/scheduling logic comes from the pure, golden-tested @algolens/retention
 * package; this module is just persistence + reactivity. The contract shapes match the API, so
 * the future server swap is a transport change.
 */
import {
  BADGES,
  computeStreak,
  dayKey,
  dueCards,
  evaluateBadges,
  GRADE_QUALITY,
  levelInfo,
  schedule,
  totalXp,
  XP_AWARDS,
  type ReviewGrade,
  type StatsSnapshot,
  type XpEvent,
} from "@algolens/retention";

export type Difficulty = "intro" | "easy" | "medium" | "hard";
export type SourceKind = "lesson" | "problem" | "visualization" | "analysis";

export interface StoredCard {
  id: string;
  sourceKind: SourceKind;
  sourceId: string;
  frontMdx: string;
  backMdx: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueAt: number;
  suspended: boolean;
}

export interface ReviewLogEntry {
  cardId: string;
  grade: ReviewGrade;
  at: number;
  intervalAfter: number;
}

export interface SolvedEntry {
  slug: string;
  tags: string[];
  at: number;
}

export interface RetentionState {
  xpEvents: XpEvent[];
  cards: StoredCard[];
  logs: ReviewLogEntry[];
  solved: SolvedEntry[];
  lessons: string[];
}

const STORAGE_KEY = "algolens-retention-v1";
const EMPTY: RetentionState = Object.freeze({
  xpEvents: [],
  cards: [],
  logs: [],
  solved: [],
  lessons: [],
});

// --- store -------------------------------------------------------------------------------------

let cache: RetentionState | null = null;
const listeners = new Set<() => void>();

function read(): RetentionState {
  if (cache) return cache;
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    const parsed = raw ? (JSON.parse(raw) as Partial<RetentionState>) : null;
    cache = parsed ? { ...EMPTY, ...parsed } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: RetentionState): void {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* in-memory fallback */
  }
  for (const l of listeners) l();
}

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function addCard(
  state: RetentionState,
  card: Pick<StoredCard, "sourceKind" | "sourceId" | "frontMdx" | "backMdx">,
  now: number,
): RetentionState {
  // Unique by (sourceKind, sourceId, front) — mirrors the DB constraint; no duplicate cards.
  const exists = state.cards.some(
    (c) =>
      c.sourceKind === card.sourceKind &&
      c.sourceId === card.sourceId &&
      c.frontMdx === card.frontMdx,
  );
  if (exists) return state;
  return {
    ...state,
    cards: [
      ...state.cards,
      {
        id: uid(),
        ...card,
        easeFactor: 2.5,
        intervalDays: 0,
        repetitions: 0,
        dueAt: now, // new cards enter the queue immediately; grading pushes the next due out
        suspended: false,
      },
    ],
  };
}

export const retentionStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): RetentionState {
    return read();
  },
  getServerSnapshot(): RetentionState {
    return EMPTY;
  },

  recordLessonComplete(slug: string, cards: { front: string; back: string }[]): void {
    const state = read();
    if (state.lessons.includes(slug)) return;
    const now = Date.now();
    let next: RetentionState = {
      ...state,
      lessons: [...state.lessons, slug],
      xpEvents: [
        ...state.xpEvents,
        { amount: XP_AWARDS.lesson_completed, reason: "lesson_completed", refId: slug, at: now },
      ],
    };
    for (const c of cards) {
      next = addCard(next, { sourceKind: "lesson", sourceId: slug, frontMdx: c.front, backMdx: c.back }, now);
    }
    write(next);
  },

  /** A missed quiz becomes its own card (the exact question) — app-flow journey 6. */
  recordQuizMiss(lessonSlug: string, quizId: string, front: string, back: string): void {
    write(addCard(read(), { sourceKind: "lesson", sourceId: `${lessonSlug}#${quizId}`, frontMdx: front, backMdx: back }, Date.now()));
  },

  recordProblemSolved(slug: string, difficulty: Difficulty, tags: string[]): void {
    const state = read();
    if (state.solved.some((s) => s.slug === slug)) return;
    const now = Date.now();
    write({
      ...state,
      solved: [...state.solved, { slug, tags, at: now }],
      xpEvents: [
        ...state.xpEvents,
        { amount: XP_AWARDS.problem_solved[difficulty], reason: "problem_solved", refId: slug, at: now },
      ],
    });
  },

  gradeCard(cardId: string, grade: ReviewGrade): void {
    const state = read();
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    const now = Date.now();
    const r = schedule(card, grade, now);
    write({
      ...state,
      cards: state.cards.map((c) =>
        c.id === cardId
          ? { ...c, easeFactor: r.easeFactor, intervalDays: r.intervalDays, repetitions: r.repetitions, dueAt: r.dueAt }
          : c,
      ),
      logs: [...state.logs, { cardId, grade, at: now, intervalAfter: r.intervalDays }],
      xpEvents: [
        ...state.xpEvents,
        { amount: XP_AWARDS.review_completed, reason: "review_completed", refId: cardId, at: now },
      ],
    });
  },
};

// --- pure selectors ----------------------------------------------------------------------------

export function localTz(): number {
  return typeof window === "undefined" ? 0 : -new Date().getTimezoneOffset();
}

export function dueOf(state: RetentionState, now: number = Date.now()): StoredCard[] {
  return dueCards(state.cards, now);
}

export function isSolved(state: RetentionState, slug: string): boolean {
  return state.solved.some((s) => s.slug === slug);
}

export interface RetentionStats {
  xpTotal: number;
  level: ReturnType<typeof levelInfo>;
  currentStreak: number;
  longestStreak: number;
  freezes: number;
  dueCount: number;
  lessonsCompleted: number;
  problemsSolved: number;
  reviewsCompleted: number;
  badgeSnapshot: StatsSnapshot;
}

export function statsSnapshot(state: RetentionState, now: number = Date.now()): RetentionStats {
  const tz = localTz();
  const xpTotal = totalXp(state.xpEvents);
  const level = levelInfo(xpTotal);
  const activity = state.xpEvents.map((e) => dayKey(e.at, tz));
  const streak = computeStreak(activity, dayKey(now, tz), 1);

  const problemsSolvedByTag: Record<string, number> = {};
  for (const s of state.solved) {
    for (const tag of s.tags) problemsSolvedByTag[tag] = (problemsSolvedByTag[tag] ?? 0) + 1;
  }

  const badgeSnapshot: StatsSnapshot = {
    lessonsCompleted: state.lessons.length,
    problemsSolved: state.solved.length,
    problemsSolvedByTag,
    reviewsCompleted: state.logs.length,
    currentStreak: streak.current,
    level: level.level,
  };

  return {
    xpTotal,
    level,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    freezes: 1,
    dueCount: dueOf(state, now).length,
    lessonsCompleted: state.lessons.length,
    problemsSolved: state.solved.length,
    reviewsCompleted: state.logs.length,
    badgeSnapshot,
  };
}

export function earnedBadges(state: RetentionState): Set<string> {
  return new Set(evaluateBadges(statsSnapshot(state).badgeSnapshot));
}

/** Day-key → activity count, for the GitHub-style heatmap. */
export function activityHeatmap(state: RetentionState): Map<string, number> {
  const tz = localTz();
  const map = new Map<string, number>();
  for (const e of state.xpEvents) {
    const key = dayKey(e.at, tz);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export { BADGES, GRADE_QUALITY };
