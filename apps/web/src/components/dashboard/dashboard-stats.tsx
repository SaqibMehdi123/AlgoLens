"use client";

import { foundationsTrack } from "@algolens/content";
import { Activity, BookOpen, FlaskConical, Play, User } from "lucide-react";
import Link from "next/link";
import { useTrackStats } from "@/components/learn/track-progress";
import {
  ActivityHeatmap,
  DueReviews,
  StreakFlame,
  useRetention,
  XpRing,
} from "@/components/retention/widgets";

const quickLinks = [
  { href: "/visualize/merge-sort", label: "Merge Sort playground", icon: Play },
  { href: "/analyze", label: "Complexity Lab", icon: Activity },
  { href: "/practice", label: "Practice problems", icon: FlaskConical },
];

/**
 * Device-local progress widgets (ADR-0003/0005) — streak, XP, continue-learning, reviews, heatmap.
 * Rendered under the server-side profile header on the dashboard.
 */
export function DashboardStats() {
  const { total, done, nextLesson } = useTrackStats(foundationsTrack);
  const state = useRetention();
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border border-subtle bg-surface p-5">
        <StreakFlame state={state} />
        <XpRing state={state} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-xl border border-subtle bg-surface p-6">
          <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted">
            <BookOpen className="size-4" aria-hidden />
            Continue learning
          </h2>
          <p className="mt-3 text-lg font-semibold text-foreground">{foundationsTrack.title}</p>
          <p className="mt-1 text-sm text-secondary">
            {done}/{total} lessons complete · {pct}%
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

        <DueReviews state={state} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-xl border border-subtle bg-surface p-6">
          <ActivityHeatmap state={state} />
        </section>
        <section className="rounded-xl border border-subtle bg-surface p-6">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">Jump back in</h2>
          <ul className="flex flex-col gap-2">
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
            <li>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg border border-subtle bg-raised px-3 py-2 text-sm text-secondary transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <User className="size-4 text-primary" aria-hidden />
                Your profile
              </Link>
            </li>
          </ul>
        </section>
      </div>

      <p className="mt-8 text-sm text-muted">
        Progress, XP, streaks, and review cards are stored on this device for now. Cross-device sync
        and the streak-freeze job arrive with durable persistence (next on the roadmap).
      </p>
    </>
  );
}
