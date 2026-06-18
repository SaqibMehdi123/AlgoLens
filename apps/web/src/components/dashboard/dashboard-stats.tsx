"use client";

import { foundationsTrack } from "@algolens/content";
import { Activity, Diamond, FlaskConical, Flame, Info, Play, User } from "lucide-react";
import Link from "next/link";
import { useTrackStats } from "@/components/learn/track-progress";
import { ActivityHeatmap, useRetention } from "@/components/retention/widgets";
import { statsSnapshot } from "@/lib/retention";

const jump = [
  { href: "/visualize/quick-sort", label: "Playground", sub: "quick sort", icon: Play, color: "text-primary" },
  { href: "/analyze", label: "Complexity Lab", sub: "analyze a function", icon: Activity, color: "text-swap" },
  { href: "/practice", label: "Problems", sub: "browse & solve", icon: FlaskConical, color: "text-sorted" },
  { href: "/profile", label: "Profile", sub: "view & share", icon: User, color: "text-visited" },
];

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/**
 * Device-local progress widgets (ADR-0003/0005), laid out per the design comp — streak/XP chips,
 * continue-learning + due-reviews, activity heatmap, and quick links.
 */
export function DashboardStats({ firstName }: { firstName?: string }) {
  const state = useRetention();
  const stats = statsSnapshot(state);
  const { total, done, nextLesson } = useTrackStats(foundationsTrack);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const mins = Math.max(1, Math.round(stats.dueCount * 0.6));

  return (
    <>
      {/* Greeting + streak / XP chips */}
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-[-0.01em] text-foreground">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}.
        </h2>
        <div className="flex gap-3">
          <div className="flex items-center gap-2.5 rounded-[11px] border border-subtle bg-surface px-3.5 py-2.5">
            <Flame className="size-[18px] text-frontier" />
            <div>
              <div className="font-mono text-[17px] font-bold leading-none text-foreground">{stats.currentStreak}</div>
              <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-wider text-muted">day streak</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-[11px] border border-subtle bg-surface px-3.5 py-2.5">
            <Diamond className="size-[18px] text-primary" />
            <div>
              <div className="font-mono text-[17px] font-bold leading-none text-foreground">
                Lv {stats.level.level} · {stats.xpTotal.toLocaleString()}
              </div>
              <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-wider text-muted">xp</div>
            </div>
          </div>
        </div>
      </div>

      {/* Continue learning + Due reviews */}
      <div className="mb-[18px] grid gap-[18px] lg:grid-cols-[1.4fr_1fr]">
        <Link
          href={nextLesson ? `/learn/${foundationsTrack.slug}/${nextLesson.slug}` : `/learn/${foundationsTrack.slug}`}
          className="lift block rounded-2xl border border-subtle bg-surface p-[22px]"
        >
          <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">Continue learning</div>
          <h3 className="text-[19px] font-semibold text-foreground">{foundationsTrack.title}</h3>
          {nextLesson && (
            <p className="mt-1 text-sm text-secondary">
              Next up: <span className="font-semibold text-foreground">{nextLesson.title}</span>
            </p>
          )}
          <div className="mb-2 mt-[18px] flex items-center justify-between font-mono text-xs text-secondary">
            <span>{done} / {total} lessons</span>
            <span className="font-semibold text-primary">{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-md bg-raised">
            <div className="h-full bg-linear-to-r from-primary to-primary-hover" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-[18px] inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold text-primary">
            {done === 0 ? "Start lesson" : "Resume lesson"} <span aria-hidden>→</span>
          </div>
        </Link>

        <Link href="/review" className="lift flex flex-col rounded-2xl border border-subtle bg-surface p-[22px]">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">Due reviews</div>
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-[48px] font-bold leading-none text-frontier">{stats.dueCount}</span>
            <span className="text-sm text-secondary">cards · ~{mins} min</span>
          </div>
          <p className="mt-3.5 text-[13.5px] leading-relaxed text-secondary">
            {stats.dueCount > 0
              ? "Spaced repetition keeps what you've learned from fading. A short session today protects your streak."
              : "You're all caught up. New cards appear as you finish lessons and miss quiz questions."}
          </p>
          <div className="mt-auto pt-[18px]">
            <span className="inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold text-primary">
              {stats.dueCount > 0 ? "Start review" : "Browse lessons"} <span aria-hidden>→</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Activity heatmap */}
      <div className="mb-[18px] rounded-2xl border border-subtle bg-surface p-[22px]">
        <ActivityHeatmap state={state} />
      </div>

      {/* Jump back in */}
      <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">Jump back in</div>
      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {jump.map(({ href, label, sub, icon: Icon, color }) => (
          <Link key={href} href={href} className="lift block rounded-[13px] border border-subtle bg-surface p-[18px]">
            <Icon className={`mb-2.5 size-[18px] ${color}`} />
            <div className="text-sm font-semibold text-foreground">{label}</div>
            <div className="mt-0.5 font-mono text-[11.5px] text-muted">{sub}</div>
          </Link>
        ))}
      </div>

      <p className="flex items-center justify-center gap-2 text-center font-mono text-xs text-muted">
        <Info className="size-3.5 text-compare" />
        Progress is stored on this device until cross-device sync ships.
      </p>
    </>
  );
}
