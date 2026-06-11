"use client";

import type { ProblemSummary } from "@algolens/api-contracts";
import { cn } from "@algolens/ui";
import { Check, Circle } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { solvedStore } from "@/lib/solved";

const DIFF_TONE: Record<string, string> = {
  intro: "text-sorted",
  easy: "text-frontier",
  medium: "text-compare",
  hard: "text-swap",
};

export function ProblemList({ problems }: { problems: ProblemSummary[] }) {
  const solved = useSyncExternalStore(
    solvedStore.subscribe,
    solvedStore.getSnapshot,
    solvedStore.getServerSnapshot,
  );
  const solvedSet = new Set(solved);

  return (
    <ul className="flex max-w-3xl flex-col gap-2">
      {problems.map((p) => (
        <li key={p.slug}>
          <Link
            href={`/practice/${p.slug}`}
            className="flex items-center gap-3 rounded-xl border border-subtle bg-surface px-4 py-3 transition-colors hover:border-primary/50 hover:bg-raised"
          >
            {solvedSet.has(p.slug) ? (
              <Check className="size-4 shrink-0 text-sorted" aria-label="Solved" />
            ) : (
              <Circle className="size-3.5 shrink-0 text-muted" aria-hidden />
            )}
            <span className="min-w-0 flex-1 font-medium text-foreground">{p.title}</span>
            <span className={cn("shrink-0 font-mono text-xs", DIFF_TONE[p.difficulty])}>
              {p.difficulty}
            </span>
            <span className="hidden shrink-0 gap-1 sm:flex">
              {p.tags.slice(0, 3).map((t) => (
                <span key={t} className="rounded-full border border-subtle bg-raised px-2 py-0.5 text-xs text-secondary">
                  {t}
                </span>
              ))}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
