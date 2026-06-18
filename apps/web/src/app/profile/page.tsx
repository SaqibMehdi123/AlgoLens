"use client";

import { foundationsTrack } from "@algolens/content";
import { User } from "lucide-react";
import { useTrackStats } from "@/components/learn/track-progress";
import { ActivityHeatmap, BadgeShelf, useRetention } from "@/components/retention/widgets";
import { statsSnapshot } from "@/lib/retention";

/**
 * Public profile (docs/05 §5.8) — résumé-friendly. Reads device-local stats until accounts ship;
 * a real /profile/[username] arrives with durable persistence.
 */
export default function ProfilePage() {
  const state = useRetention();
  const s = statsSnapshot(state);
  const { total, done } = useTrackStats(foundationsTrack);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const tiles = [
    { value: s.problemsSolved, label: "problems solved", color: "text-sorted" },
    { value: s.lessonsCompleted, label: "lessons complete", color: "text-primary" },
    { value: s.currentStreak, label: "day streak", color: "text-frontier" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1000px] py-8">
      {/* Identity */}
      <div className="mb-7 flex flex-wrap items-center gap-5">
        <div className="grid size-[76px] shrink-0 place-items-center rounded-[20px] bg-linear-to-br from-primary to-visited text-white">
          <User className="size-9" />
        </div>
        <div className="min-w-[200px] flex-1">
          <h1 className="text-[26px] font-bold text-foreground">Your progress</h1>
          <div className="mt-1 font-mono text-[13px] text-secondary">
            Level {s.level.level} · {s.xpTotal.toLocaleString()} XP · saved on this device
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-7 grid gap-3.5 sm:grid-cols-3">
        {tiles.map(({ value, label, color }) => (
          <div key={label} className="rounded-[14px] border border-subtle bg-surface p-[18px]">
            <div className={`font-mono text-[30px] font-bold ${color}`}>{value}</div>
            <div className="mt-0.5 font-mono text-[11.5px] uppercase tracking-wide text-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="mb-7 rounded-[14px] border border-subtle bg-surface p-5">
        <BadgeShelf state={state} />
      </div>

      {/* Track completion */}
      <div className="mb-7 rounded-[14px] border border-subtle bg-surface p-5">
        <div className="mb-4 font-mono text-[11px] uppercase tracking-wider text-muted">Track completion</div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">{foundationsTrack.title}</span>
          <span className="font-mono text-xs text-primary">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-md bg-raised">
          <div className="h-full bg-linear-to-r from-primary to-primary-hover" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Solved activity */}
      <div className="rounded-[14px] border border-subtle bg-surface p-5">
        <ActivityHeatmap state={state} weeks={16} />
      </div>
    </div>
  );
}
