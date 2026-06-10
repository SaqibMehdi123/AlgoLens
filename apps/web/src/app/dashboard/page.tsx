"use client";

import { foundationsTrack } from "@algolens/content";
import { Activity, BookOpen, FlaskConical, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTrackStats } from "@/components/learn/track-progress";

const quickLinks = [
  { href: "/visualize/merge-sort", label: "Merge Sort playground", icon: Play },
  { href: "/analyze", label: "Complexity Lab", icon: Activity },
  { href: "/practice", label: "Practice problems", icon: FlaskConical },
];

/**
 * Dashboard (docs/05 §5.2). Progress/XP are device-local until Auth.js + Postgres land
 * (ADR-0003); streaks and the review queue arrive with Phase 5.
 */
export default function DashboardPage() {
  const { total, done, nextLesson, progress } = useTrackStats(foundationsTrack);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="py-10">
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="flex items-center gap-1.5 font-mono text-sm text-secondary">
          <Sparkles className="size-4 text-primary" aria-hidden />
          {progress.xpTotal} XP
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Continue learning */}
        <section className="rounded-xl border border-subtle bg-surface p-6">
          <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted">
            <BookOpen className="size-4" aria-hidden />
            Continue learning
          </h2>
          <p className="mt-3 text-lg font-semibold text-foreground">{foundationsTrack.title}</p>
          <p className="mt-1 text-sm text-secondary">
            {done}/{total} lessons complete
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-raised" aria-hidden>
            <div className="h-full bg-sorted transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          {nextLesson && (
            <Link
              href={`/learn/${foundationsTrack.slug}/${nextLesson.slug}`}
              className="mt-5 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              {done === 0 ? "Start" : "Continue"}: {nextLesson.title} →
            </Link>
          )}
        </section>

        {/* Jump back in */}
        <section className="rounded-xl border border-subtle bg-surface p-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Jump back in</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {quickLinks.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-2 rounded-lg border border-subtle bg-raised px-3 py-2 text-sm text-secondary transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  <Icon className="size-4 text-primary" aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className="mt-8 text-sm text-muted">
        Progress and XP are stored on this device for now. Accounts (sync across devices), streaks,
        and the spaced-repetition review queue arrive with the auth and retention phases.
      </p>
    </div>
  );
}
