"use client";

import type { LessonMeta, TrackMeta } from "@algolens/content";
import { cn } from "@algolens/ui";
import { ArrowRight, Check, ChevronLeft, Circle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { XP_AWARDS } from "@algolens/retention";
import { LessonContext } from "@/components/mdx/lesson-context";
import { progressStore } from "@/lib/progress";
import { retentionStore } from "@/lib/retention";

const XP_PER_LESSON = XP_AWARDS.lesson_completed;

export interface LessonShellProps {
  track: TrackMeta;
  lesson: LessonMeta;
  next: LessonMeta | null;
  children: ReactNode;
}

function useProgress() {
  const store = progressStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function LessonShell({ track, lesson, next, children }: LessonShellProps) {
  const articleRef = useRef<HTMLDivElement>(null);
  const [scrollPct, setScrollPct] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const progress = useProgress();

  const store = progressStore();
  const lessonProgress = progress.lessons[lesson.slug];
  const passedCount = lessonProgress?.passedQuizzes.length ?? 0;
  const completed = Boolean(lessonProgress?.completedAt);

  // On the completion transition, hand XP + review-card creation to the retention ledger.
  function onComplete(): boolean {
    if (store.tryComplete(lesson.slug, lesson.quizCount)) {
      retentionStore.recordLessonComplete(lesson.slug, lesson.reviewCards);
      return true;
    }
    return false;
  }

  // Scroll tracking → monotonic progress + completion attempt (scroll ≥ 90 + quizzes passed).
  useEffect(() => {
    function onScroll() {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const read = total <= 0 ? 100 : Math.min(100, Math.max(0, (-rect.top / total) * 100));
      setScrollPct(read);
      store.updateScroll(lesson.slug, read);
      if (onComplete()) setJustCompleted(true);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lesson.slug, lesson.quizCount, store]);

  // Quiz passes can complete the lesson while already scrolled to the bottom.
  useEffect(() => {
    if (onComplete()) setJustCompleted(true);
  }, [passedCount, lesson.slug, lesson.quizCount, store]);

  return (
    <LessonContext.Provider value={lesson.slug}>
      {/* Sticky slim progress bar (docs/05 §5.5) */}
      <div className="sticky top-14 z-30 -mx-4 h-1 bg-raised sm:-mx-6" aria-hidden>
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${completed ? 100 : scrollPct}%` }}
        />
      </div>

      <div className="grid gap-10 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Track outline */}
        <aside className="hidden lg:block">
          <nav aria-label="Track outline" className="sticky top-24 text-sm">
            <Link
              href={`/learn/${track.slug}`}
              className="mb-3 inline-flex items-center gap-1 text-secondary transition-colors hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              {track.title}
            </Link>
            <ul className="flex flex-col gap-0.5 border-l border-subtle">
              {track.modules.flatMap((m) =>
                m.lessons.map((l) => {
                  const done = Boolean(progress.lessons[l.slug]?.completedAt);
                  const current = l.slug === lesson.slug;
                  return (
                    <li key={l.slug}>
                      <Link
                        href={`/learn/${track.slug}/${l.slug}`}
                        aria-current={current ? "page" : undefined}
                        className={cn(
                          "-ml-px flex items-center gap-2 border-l-2 py-1.5 pl-3 transition-colors",
                          current
                            ? "border-primary text-foreground"
                            : "border-transparent text-secondary hover:text-foreground",
                        )}
                      >
                        {done ? (
                          <Check className="size-3.5 shrink-0 text-sorted" aria-label="Completed" />
                        ) : (
                          <Circle className="size-3 shrink-0 text-muted" aria-hidden />
                        )}
                        <span className="truncate">{l.title}</span>
                      </Link>
                    </li>
                  );
                }),
              )}
            </ul>
          </nav>
        </aside>

        {/* Prose column — 68ch (docs/05 §2); embedded blocks break out via not-prose styling */}
        <div ref={articleRef} className="min-w-0">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
            {track.title} · {lesson.estMinutes} min · {passedCount}/{lesson.quizCount} quizzes
          </p>
          <article
            className={cn(
              "prose prose-invert max-w-[68ch]",
              "prose-headings:tracking-tight prose-headings:text-foreground",
              "prose-p:text-secondary prose-li:text-secondary prose-strong:text-foreground",
              "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
              "prose-code:rounded prose-code:bg-raised prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.9em] prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none",
              "prose-pre:border prose-pre:border-subtle prose-pre:bg-raised",
              "prose-table:text-sm prose-th:text-foreground prose-td:text-secondary",
              "prose-hr:border-subtle prose-blockquote:border-l-subtle prose-blockquote:text-secondary",
            )}
          >
            {children}
          </article>

          {/* Completion card (docs/05 §5.5: +XP, next-lesson CTA) */}
          <div
            className={cn(
              "mt-12 max-w-[68ch] rounded-xl border p-6",
              completed
                ? "border-[var(--viz-sorted)]/50 bg-[color-mix(in_srgb,var(--viz-sorted)_8%,transparent)]"
                : "border-subtle bg-surface",
            )}
            role="status"
          >
            {completed ? (
              <>
                <p className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Sparkles className="size-5 text-sorted" aria-hidden />
                  Lesson complete{justCompleted ? ` — +${XP_PER_LESSON} XP` : ""}
                </p>
                <p className="mt-1 text-sm text-secondary">
                  {lesson.quizCount}/{lesson.quizCount} quizzes passed. Progress saved on this
                  device.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-foreground">Finish the lesson</p>
                <p className="mt-1 text-sm text-secondary">
                  Read to the end and pass {lesson.quizCount === 1 ? "the quiz" : `all ${lesson.quizCount} quizzes`}{" "}
                  to complete it ({passedCount}/{lesson.quizCount} so far).
                </p>
              </>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              {next ? (
                <Link
                  href={`/learn/${track.slug}/${next.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  Next: {next.title}
                  <ArrowRight className="size-4" />
                </Link>
              ) : (
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  Back to tracks
                </Link>
              )}
              {lesson.practiceSlug && (
                <Link
                  href={`/practice/${lesson.practiceSlug}`}
                  className="inline-flex items-center rounded-lg border border-subtle px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-raised"
                >
                  Practice this
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </LessonContext.Provider>
  );
}
