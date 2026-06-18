"use client";

import { dayKey } from "@algolens/retention";
import { cn } from "@algolens/ui";
import { Flame } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  activityHeatmap,
  BADGES,
  earnedBadges,
  localTz,
  retentionStore,
  statsSnapshot,
  type RetentionState,
} from "@/lib/retention";

export function useRetention(): RetentionState {
  return useSyncExternalStore(
    retentionStore.subscribe,
    retentionStore.getSnapshot,
    retentionStore.getServerSnapshot,
  );
}

/** Circular XP / level ring. */
export function XpRing({ state }: { state: RetentionState }) {
  const s = statsSnapshot(state);
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - s.level.progress);
  return (
    <div className="flex items-center gap-3">
      <svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label={`Level ${s.level.level}`}>
        <circle cx="42" cy="42" r={r} fill="none" stroke="var(--raised)" strokeWidth="7" />
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 42 42)"
          style={{ transition: "stroke-dashoffset 0.4s ease-out" }}
        />
        <text x="42" y="38" textAnchor="middle" className="fill-foreground" fontSize="18" fontWeight="700">
          {s.level.level}
        </text>
        <text x="42" y="52" textAnchor="middle" fill="var(--muted-fg)" fontSize="9">
          LEVEL
        </text>
      </svg>
      <div>
        <p className="font-mono text-lg font-semibold text-foreground">{s.xpTotal} XP</p>
        <p className="text-xs text-secondary">{s.level.xpForNextLevel} XP to level {s.level.level + 1}</p>
      </div>
    </div>
  );
}

export function StreakFlame({ state }: { state: RetentionState }) {
  const s = statsSnapshot(state);
  const active = s.currentStreak > 0;
  return (
    <div className="flex items-center gap-2">
      <Flame
        className={cn("size-7", active ? "text-compare" : "text-muted")}
        fill={active ? "var(--viz-compare)" : "none"}
        aria-hidden
      />
      <div>
        <p className="font-mono text-lg font-semibold text-foreground">{s.currentStreak}</p>
        <p className="text-xs text-secondary">day streak{s.longestStreak > s.currentStreak ? ` · best ${s.longestStreak}` : ""}</p>
      </div>
    </div>
  );
}

export function DueReviews({ state }: { state: RetentionState }) {
  const s = statsSnapshot(state);
  const mins = Math.max(1, Math.round(s.dueCount * 0.4));
  return (
    <Link
      href="/review"
      className="block rounded-xl border border-subtle bg-surface p-5 transition-colors hover:border-primary/50 hover:bg-raised"
    >
      <p className="text-sm font-medium uppercase tracking-wide text-muted">Due reviews</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">
        {s.dueCount} card{s.dueCount === 1 ? "" : "s"}
      </p>
      <p className="mt-1 text-sm text-secondary">
        {s.dueCount === 0 ? "All caught up — complete a lesson to grow your deck." : `~${mins} min · review now →`}
      </p>
    </Link>
  );
}

/** GitHub-style activity heatmap of the last `weeks` weeks. */
export function ActivityHeatmap({ state, weeks = 12 }: { state: RetentionState; weeks?: number }) {
  const map = activityHeatmap(state);
  const tz = localTz();
  const today = Date.now();
  const days = weeks * 7;
  const cells: { key: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(today - i * 86_400_000, tz);
    cells.push({ key, count: map.get(key) ?? 0 });
  }
  const level = (n: number) => (n === 0 ? 0 : n <= 1 ? 1 : n <= 3 ? 2 : 3);
  const colors = ["var(--raised)", "color-mix(in srgb, var(--viz-sorted) 35%, transparent)", "color-mix(in srgb, var(--viz-sorted) 65%, transparent)", "var(--viz-sorted)"];

  return (
    <div>
      <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">Activity</p>
      <div className="grid grid-flow-col grid-rows-7 gap-1" role="img" aria-label="Activity heatmap">
        {cells.map((cell) => (
          <span
            key={cell.key}
            title={`${cell.key}: ${cell.count} action${cell.count === 1 ? "" : "s"}`}
            className="size-3 rounded-[3px]"
            style={{ backgroundColor: colors[level(cell.count)] }}
          />
        ))}
      </div>
    </div>
  );
}

export function BadgeShelf({ state }: { state: RetentionState }) {
  const earned = earnedBadges(state);
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">Badges</p>
      <div className="flex flex-wrap gap-3">
        {BADGES.map((b) => {
          const has = earned.has(b.slug);
          return (
            <div
              key={b.slug}
              title={`${b.name} — ${b.description}`}
              className={cn(
                "flex w-20 flex-col items-center gap-1 rounded-xl border p-3 text-center",
                has ? "border-subtle bg-surface" : "border-dashed border-subtle bg-transparent opacity-40",
              )}
            >
              <span className="text-2xl" aria-hidden>{b.icon}</span>
              <span className="text-[11px] leading-tight text-secondary">{b.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
