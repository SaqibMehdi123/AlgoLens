"use client";

import type { TrackMeta } from "@algolens/content";
import { cn } from "@algolens/ui";
import { Check, Circle, Lock } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { progressStore } from "@/lib/progress";

function useProgress() {
  const store = progressStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function useTrackStats(track: TrackMeta) {
  const progress = useProgress();
  const lessons = track.modules.flatMap((m) => m.lessons);
  const done = lessons.filter((l) => progress.lessons[l.slug]?.completedAt).length;
  const nextLesson =
    lessons.find((l) => !progress.lessons[l.slug]?.completedAt) ?? lessons[0] ?? null;
  return { total: lessons.length, done, nextLesson, progress };
}

/** Track card for the /learn catalog: progress bar + continue CTA. */
export function TrackCard({ track }: { track: TrackMeta }) {
  const { total, done, nextLesson } = useTrackStats(track);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="rounded-xl border border-subtle bg-surface p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">{track.title}</h2>
        <span className="font-mono text-xs text-secondary">
          {done}/{total} lessons
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-secondary">{track.description}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-raised" aria-hidden>
        <div className="h-full bg-sorted transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-4 flex gap-3">
        <Link
          href={`/learn/${track.slug}`}
          className="rounded-lg border border-subtle px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-raised"
        >
          Track overview
        </Link>
        {nextLesson && (
          <Link
            href={`/learn/${track.slug}/${nextLesson.slug}`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            {done === 0 ? "Start" : "Continue"}: {nextLesson.title}
          </Link>
        )}
      </div>
    </div>
  );
}

/** Module/lesson listing for the track overview page, with completion + prerequisite states. */
export function TrackOutline({ track }: { track: TrackMeta }) {
  const { progress } = useTrackStats(track);
  const completedSet = new Set(
    Object.entries(progress.lessons)
      .filter(([, p]) => p.completedAt)
      .map(([slug]) => slug),
  );

  return (
    <div className="flex flex-col gap-8">
      {track.modules.map((module) => (
        <section key={module.slug}>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">
            {module.position}. {module.title}
          </h2>
          <ul className="flex flex-col gap-2">
            {module.lessons.map((lesson) => {
              const done = completedSet.has(lesson.slug);
              const blocked = lesson.prerequisites.some((p) => !completedSet.has(p));
              return (
                <li key={lesson.slug}>
                  <Link
                    href={`/learn/${track.slug}/${lesson.slug}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-subtle bg-surface px-4 py-3 transition-colors hover:border-primary/50 hover:bg-raised",
                    )}
                  >
                    {done ? (
                      <Check className="size-4 shrink-0 text-sorted" aria-label="Completed" />
                    ) : blocked ? (
                      <Lock className="size-4 shrink-0 text-muted" aria-label="Has prerequisites" />
                    ) : (
                      <Circle className="size-3.5 shrink-0 text-muted" aria-hidden />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{lesson.title}</p>
                      <p className="truncate text-xs text-secondary">{lesson.summary}</p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted">
                      {lesson.estMinutes} min
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
