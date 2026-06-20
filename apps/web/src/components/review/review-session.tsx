"use client";

import { intervalPreview, type ReviewGrade } from "@algolens/retention";
import { cn } from "@algolens/ui";
import { ArrowRight, Brain, Sparkles } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { dueOf, retentionStore, statsSnapshot, type StoredCard } from "@/lib/retention";

/** Render the limited markdown used in card fronts/backs: **bold** and `code`. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i} className="text-foreground">{p.slice(2, -2)}</strong>;
        if (p.startsWith("`") && p.endsWith("`"))
          return <code key={i} className="rounded bg-raised px-1 font-mono text-foreground">{p.slice(1, -1)}</code>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

function fmtInterval(days: number): string {
  if (days <= 1) return "1d";
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

const GRADES: { grade: ReviewGrade; label: string; tone: string }[] = [
  { grade: "again", label: "Again", tone: "border-[var(--viz-pivot)] text-pivot hover:bg-[color-mix(in_srgb,var(--viz-pivot)_12%,transparent)]" },
  { grade: "hard", label: "Hard", tone: "border-[var(--viz-frontier)] text-frontier hover:bg-[color-mix(in_srgb,var(--viz-frontier)_12%,transparent)]" },
  { grade: "good", label: "Good", tone: "border-[var(--viz-swap)] text-swap hover:bg-[color-mix(in_srgb,var(--viz-swap)_12%,transparent)]" },
  { grade: "easy", label: "Easy", tone: "border-[var(--viz-sorted)] text-sorted hover:bg-[color-mix(in_srgb,var(--viz-sorted)_12%,transparent)]" },
];

export function ReviewSession() {
  // Capture the due queue once (client-only) so grading doesn't shift it mid-session.
  const [queue, setQueue] = useState<StoredCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setQueue(dueOf(retentionStore.getSnapshot()));
  }, []);

  const current = queue?.[index] ?? null;
  const preview = useMemo(() => (current ? intervalPreview(current) : null), [current]);

  // Keyboard: space/enter reveals; 1–4 grade (Anki-like), only once revealed.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return;
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        grade(GRADES[Number(e.key) - 1]!.grade);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function grade(g: ReviewGrade) {
    if (!current) return;
    retentionStore.gradeCard(current.id, g);
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  if (queue === null) {
    return <p className="py-24 text-center text-muted">Loading your deck…</p>;
  }

  // Empty-state teaches (docs/04 §8).
  if (queue.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <Brain className="mx-auto size-10 text-muted" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold">No cards due</h1>
        <p className="mt-2 text-secondary">
          Complete a lesson to grow your deck — key facts and any quiz you miss become review
          cards, scheduled with SM-2 spaced repetition.
        </p>
        <Link href="/learn" className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 font-mono text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
          Browse lessons
        </Link>
      </div>
    );
  }

  // Session summary.
  if (index >= queue.length) {
    const stats = statsSnapshot(retentionStore.getSnapshot());
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <Sparkles className="mx-auto size-10 text-sorted" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold">Session complete</h1>
        <p className="mt-2 text-secondary">
          {queue.length} card{queue.length === 1 ? "" : "s"} reviewed · {stats.currentStreak}-day streak ·{" "}
          {stats.xpTotal} XP
        </p>
        <Link href="/dashboard" className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 font-mono text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const progress = (index / queue.length) * 100;

  return (
    <div className="mx-auto flex max-w-xl flex-col py-8">
      {/* Thin session progress bar */}
      <div className="mb-10 h-1 w-full overflow-hidden rounded-full bg-raised" aria-hidden>
        <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${progress}%` }} />
      </div>

      <p className="mb-3 text-center font-mono text-xs text-muted">
        {index + 1} / {queue.length}
      </p>

      {/* The card */}
      <button
        type="button"
        onClick={() => !revealed && setRevealed(true)}
        disabled={revealed}
        className={cn(
          "min-h-[220px] rounded-2xl border border-subtle bg-surface p-8 text-center transition-colors",
          !revealed && "cursor-pointer hover:border-primary/40",
        )}
        aria-label={revealed ? "Card revealed" : "Reveal answer"}
      >
        <p className="text-xl font-medium text-foreground">
          <Inline text={current!.frontMdx} />
        </p>
        {revealed && (
          <>
            <hr className="my-6 border-subtle" />
            <p className="text-lg text-secondary">
              <Inline text={current!.backMdx} />
            </p>
          </>
        )}
        {!revealed && <p className="mt-6 text-xs text-muted">tap or press space to reveal</p>}
      </button>

      {/* Grades with interval previews */}
      {revealed && preview && (
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GRADES.map(({ grade: g, label, tone }, i) => (
            <button
              key={g}
              type="button"
              onClick={() => grade(g)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl border bg-surface py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                tone,
              )}
            >
              <span>{label}</span>
              <span className="font-mono text-xs opacity-70">
                {i + 1} · {fmtInterval(preview[g])}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
