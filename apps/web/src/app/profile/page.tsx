"use client";

import { BookOpen, Brain, FlaskConical } from "lucide-react";
import {
  ActivityHeatmap,
  BadgeShelf,
  StreakFlame,
  useRetention,
  XpRing,
} from "@/components/retention/widgets";
import { statsSnapshot } from "@/lib/retention";

/**
 * Public profile (docs/05 §5.8) — résumé-friendly. Reads device-local stats until accounts ship;
 * a real /profile/[username] becomes available with auth.
 */
export default function ProfilePage() {
  const state = useRetention();
  const s = statsSnapshot(state);

  const tiles = [
    { icon: BookOpen, label: "Lessons completed", value: s.lessonsCompleted },
    { icon: FlaskConical, label: "Problems solved", value: s.problemsSolved },
    { icon: Brain, label: "Reviews done", value: s.reviewsCompleted },
  ];

  return (
    <div className="py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your Profile</h1>
          <p className="mt-1 text-sm text-secondary">Local progress on this device.</p>
        </div>
        <div className="flex items-center gap-6">
          <StreakFlame state={state} />
          <XpRing state={state} />
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {tiles.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-subtle bg-surface p-5">
            <Icon className="size-5 text-primary" aria-hidden />
            <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
            <p className="text-sm text-secondary">{label}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-subtle bg-surface p-6">
        <ActivityHeatmap state={state} weeks={16} />
      </section>

      <section className="mt-4 rounded-xl border border-subtle bg-surface p-6">
        <BadgeShelf state={state} />
      </section>
    </div>
  );
}
