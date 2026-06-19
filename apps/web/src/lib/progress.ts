/**
 * Client-side progress store (ADR-0003). Until Auth.js + Postgres are wired, lesson progress,
 * quiz passes, and XP live in localStorage with the same shapes as the API contracts
 * (progressPut / quizAttemptCreate), so swapping to server persistence is a transport change,
 * not a redesign. Reactive via subscribe/getSnapshot (useSyncExternalStore-compatible).
 */
export interface LessonProgress {
  scrollPct: number;
  passedQuizzes: string[];
  completedAt: string | null;
}

export interface ProgressState {
  lessons: Record<string, LessonProgress>;
}

const STORAGE_KEY = "algolens-progress-v1";
const EMPTY: ProgressState = { lessons: {} };

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): StorageLike | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function createProgressStore(storage: StorageLike | null = defaultStorage()) {
  let state: ProgressState = EMPTY;
  const listeners = new Set<() => void>();

  if (storage) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && "lessons" in parsed) {
          state = parsed as ProgressState;
        }
      }
    } catch {
      // Corrupt storage → start fresh rather than crash the reader.
    }
  }

  function persist(next: ProgressState): void {
    state = next;
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Quota/privacy-mode failures degrade to in-memory progress.
    }
    for (const l of listeners) l();
  }

  function lesson(slug: string): LessonProgress {
    return state.lessons[slug] ?? { scrollPct: 0, passedQuizzes: [], completedAt: null };
  }

  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot(): ProgressState {
      return state;
    },
    getServerSnapshot(): ProgressState {
      return EMPTY;
    },
    getLesson: lesson,

    /** Monotonic — scrolling back up never loses reading progress. */
    updateScroll(slug: string, pct: number): void {
      const cur = lesson(slug);
      const clamped = Math.max(0, Math.min(100, Math.round(pct)));
      if (clamped <= cur.scrollPct) return;
      persist({
        ...state,
        lessons: { ...state.lessons, [slug]: { ...cur, scrollPct: clamped } },
      });
    },

    recordQuizPass(slug: string, quizId: string): void {
      const cur = lesson(slug);
      if (cur.passedQuizzes.includes(quizId)) return;
      persist({
        ...state,
        lessons: {
          ...state.lessons,
          [slug]: { ...cur, passedQuizzes: [...cur.passedQuizzes, quizId] },
        },
      });
    },

    /**
     * Completion = read to the end (scroll ≥ 90) AND all quizzes passed (docs/03 §2 semantics).
     * Returns true only on the transition; XP + review cards are awarded by the retention store.
     */
    tryComplete(slug: string, quizCount: number): boolean {
      const cur = lesson(slug);
      if (cur.completedAt) return false;
      if (cur.scrollPct < 90 || cur.passedQuizzes.length < quizCount) return false;
      persist({
        lessons: {
          ...state.lessons,
          [slug]: { ...cur, completedAt: new Date().toISOString() },
        },
      });
      return true;
    },

    isCompleted(slug: string): boolean {
      return lesson(slug).completedAt !== null;
    },

    /**
     * Merge server-side progress into local (monotonic: keep the further scroll + any completion).
     * Used to hydrate a signed-in device from the account without losing local progress.
     */
    merge(
      serverLessons: Record<string, { status?: string; scrollPct?: number; completedAt?: string | null }>,
    ): void {
      const next: Record<string, LessonProgress> = { ...state.lessons };
      for (const [slug, sv] of Object.entries(serverLessons)) {
        const cur = next[slug] ?? { scrollPct: 0, passedQuizzes: [], completedAt: null };
        const serverCompletedAt =
          sv.completedAt ?? (sv.status === "completed" ? new Date().toISOString() : null);
        next[slug] = {
          scrollPct: Math.max(cur.scrollPct, sv.scrollPct ?? 0),
          passedQuizzes: cur.passedQuizzes,
          completedAt: cur.completedAt ?? serverCompletedAt,
        };
      }
      persist({ ...state, lessons: next });
    },
  };
}

export type ProgressStore = ReturnType<typeof createProgressStore>;

/** App-wide singleton (created lazily so tests can build isolated stores). */
let appStore: ProgressStore | null = null;
export function progressStore(): ProgressStore {
  if (!appStore) appStore = createProgressStore();
  return appStore;
}
