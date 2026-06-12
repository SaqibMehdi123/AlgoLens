import { describe, expect, it, vi } from "vitest";
import { createProgressStore } from "../src/lib/progress";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    dump: () => map,
  };
}

describe("progress store", () => {
  it("scroll progress is monotonic", () => {
    const store = createProgressStore(memoryStorage());
    store.updateScroll("big-o-notation", 40);
    store.updateScroll("big-o-notation", 20); // scrolling back up
    expect(store.getLesson("big-o-notation").scrollPct).toBe(40);
  });

  it("records quiz passes idempotently", () => {
    const store = createProgressStore(memoryStorage());
    store.recordQuizPass("big-o-notation", "q1");
    store.recordQuizPass("big-o-notation", "q1");
    expect(store.getLesson("big-o-notation").passedQuizzes).toEqual(["q1"]);
  });

  it("completes only when scroll ≥ 90 AND all quizzes passed, exactly once", () => {
    const store = createProgressStore(memoryStorage());
    store.updateScroll("l", 95);
    expect(store.tryComplete("l", 2)).toBe(false); // quizzes missing
    store.recordQuizPass("l", "q1");
    store.recordQuizPass("l", "q2");
    expect(store.tryComplete("l", 2)).toBe(true); // transition
    expect(store.tryComplete("l", 2)).toBe(false); // already complete
    expect(store.isCompleted("l")).toBe(true);
  });

  it("persists across store instances via storage", () => {
    const storage = memoryStorage();
    const a = createProgressStore(storage);
    a.updateScroll("l", 50);
    const b = createProgressStore(storage);
    expect(b.getLesson("l").scrollPct).toBe(50);
  });

  it("survives corrupt storage and missing storage", () => {
    const corrupt = { getItem: () => "{not json", setItem: vi.fn() };
    expect(createProgressStore(corrupt).getSnapshot().lessons).toEqual({});
    const none = createProgressStore(null);
    none.updateScroll("l", 10);
    expect(none.getLesson("l").scrollPct).toBe(10); // in-memory fallback
  });

  it("notifies subscribers on change and stops after unsubscribe", () => {
    const store = createProgressStore(memoryStorage());
    const spy = vi.fn();
    const unsub = store.subscribe(spy);
    store.updateScroll("l", 10);
    expect(spy).toHaveBeenCalledTimes(1);
    unsub();
    store.updateScroll("l", 20);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
