/** Device-local solved-problems set (ADR-0003 pattern; becomes user_problem_status with the DB). */
const KEY = "algolens-solved-v1";

let cache: Set<string> | null = null;
const listeners = new Set<() => void>();
let snapshot: string[] = [];

function load(): Set<string> {
  if (cache) return cache;
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    cache = new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    cache = new Set();
  }
  snapshot = [...cache];
  return cache;
}

export const solvedStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): string[] {
    load();
    return snapshot;
  },
  getServerSnapshot(): string[] {
    return [];
  },
  markSolved(slug: string): void {
    const set = load();
    if (set.has(slug)) return;
    set.add(slug);
    snapshot = [...set];
    try {
      window.localStorage.setItem(KEY, JSON.stringify(snapshot));
    } catch {
      /* in-memory fallback */
    }
    for (const l of listeners) l();
  },
};
