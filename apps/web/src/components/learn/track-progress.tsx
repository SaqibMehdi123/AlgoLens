"use client";

import type { TrackMeta } from "@algolens/content";
import { cn } from "@algolens/ui";
import { BookOpen, Check, Circle, Lock } from "lucide-react";
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

/** Track card for the /learn catalog (design comp): icon, level badge, stats row, progress bar. */
export function TrackCard({ track }: { track: TrackMeta }) {
  const { total, done } = useTrackStats(track);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const moduleCount = track.modules.length;
  const minutes = track.modules.flatMap((m) => m.lessons).reduce((sum, l) => sum + l.estMinutes, 0);
  const hours = Math.max(1, Math.round(minutes / 60));
  return (
    <Link
      href={`/learn/${track.slug}`}
      className="lift block rounded-[18px] border border-subtle bg-surface p-[26px]"
    >
      <div className="flex flex-wrap items-start gap-5">
        <div className="grid size-[58px] shrink-0 place-items-center rounded-[15px] bg-primary/10 text-primary">
          <BookOpen className="size-6" />
        </div>
        <div className="min-w-[240px] flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
            <h2 className="text-[21px] font-bold text-foreground">{track.title}</h2>
            <span className="rounded-md border border-sorted px-2 py-0.5 font-mono text-[11px] font-semibold text-sorted">
              Beginner → Intermediate
            </span>
          </div>
          <p className="mb-4 max-w-[620px] text-[14.5px] leading-relaxed text-secondary">
            {track.description}
          </p>
          <div className="mb-3.5 flex flex-wrap items-center gap-3 font-mono text-[12.5px] text-secondary">
            <span>{moduleCount} modules</span>
            <span className="text-border-strong">·</span>
            <span>{total} lessons</span>
            <span className="text-border-strong">·</span>
            <span>~{hours} hours</span>
          </div>
          <div className="mb-2 flex items-center justify-between font-mono text-xs text-secondary">
            <span>
              {done} / {total} complete
            </span>
            <span className="font-semibold text-primary">{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-md bg-raised">
            <div className="h-full bg-linear-to-r from-primary to-primary-hover" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </Link>
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
