"use client";

import { cn } from "@algolens/ui";
import { Check, CircleHelp, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { progressStore } from "@/lib/progress";
import { retentionStore } from "@/lib/retention";
import { useLessonSlug } from "./lesson-context";

export interface QuizReplay {
  algo: string;
  frame: number;
  /** Extra playground query (e.g. "v=4,8,15&target=8") so the replay shows the same input. */
  query?: string;
  label: string;
}

export interface QuizProps {
  id: string;
  type: "complexity_pick" | "predict_output" | "single_choice";
  prompt: string;
  /** Optional code listing shown above the options (predict_output). */
  code?: string;
  options: string[];
  /** Index of the correct option. */
  answer: number;
  explanation: string;
  /** The signature move (docs/04 journey 2): wrong answer → replay the viz at the failing step. */
  replay?: QuizReplay;
}

const TYPE_LABEL: Record<QuizProps["type"], string> = {
  complexity_pick: "What's the complexity?",
  predict_output: "Predict the output",
  single_choice: "Quick check",
};

function replayHref(r: QuizReplay): string {
  const base = `/visualize/${r.algo}`;
  const parts = [r.query, r.frame > 0 ? `frame=${r.frame}` : ""].filter(Boolean);
  return parts.length ? `${base}?${parts.join("&")}` : base;
}

export function Quiz({ id, type, prompt, code, options, answer, explanation, replay }: QuizProps) {
  const lessonSlug = useLessonSlug();
  const [selected, setSelected] = useState<number | null>(null);
  const [resolved, setResolved] = useState<"correct" | "wrong" | null>(null);

  const mono = type === "complexity_pick";

  function choose(i: number) {
    if (resolved === "correct") return;
    setSelected(i);
    const correct = i === answer;
    setResolved(correct ? "correct" : "wrong");
    if (!lessonSlug) return;
    if (correct) {
      progressStore().recordQuizPass(lessonSlug, id);
    } else {
      // The exact missed question becomes a review card (app-flow journey 6).
      retentionStore.recordQuizMiss(lessonSlug, id, prompt, options[answer] ?? "");
    }
  }

  return (
    <section
      aria-label={TYPE_LABEL[type]}
      className="not-prose my-8 rounded-xl border border-subtle bg-surface p-5"
    >
      <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
        <CircleHelp className="size-4" aria-hidden />
        {TYPE_LABEL[type]}
      </p>
      <p className="text-[15px] font-medium text-foreground">{prompt}</p>

      {code && (
        <pre className="mt-3 overflow-x-auto rounded-lg border border-subtle bg-raised p-3 font-mono text-[13px] leading-relaxed text-foreground">
          <code>{code}</code>
        </pre>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2" role="group" aria-label="Answer options">
        {options.map((option, i) => {
          const isSelected = selected === i;
          const showCorrect = resolved !== null && i === answer && resolved === "correct";
          const showWrong = isSelected && resolved === "wrong";
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              disabled={resolved === "correct"}
              aria-pressed={isSelected}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                mono && "font-mono",
                showCorrect
                  ? "border-[var(--viz-sorted)] bg-[color-mix(in_srgb,var(--viz-sorted)_14%,transparent)] text-foreground"
                  : showWrong
                    ? "border-[var(--viz-swap)] bg-[color-mix(in_srgb,var(--viz-swap)_12%,transparent)] text-foreground"
                    : "border-subtle bg-raised text-secondary hover:border-primary/50 hover:text-foreground",
              )}
            >
              <span>{option}</span>
              {showCorrect && <Check className="size-4 shrink-0 text-sorted" aria-label="Correct" />}
              {showWrong && <X className="size-4 shrink-0 text-swap" aria-label="Incorrect" />}
            </button>
          );
        })}
      </div>

      {resolved && (
        <div
          role="status"
          className={cn(
            "mt-4 rounded-lg border p-4 text-sm leading-relaxed",
            resolved === "correct"
              ? "border-[var(--viz-sorted)]/40 bg-[color-mix(in_srgb,var(--viz-sorted)_8%,transparent)]"
              : "border-[var(--viz-swap)]/40 bg-[color-mix(in_srgb,var(--viz-swap)_7%,transparent)]",
          )}
        >
          <p className="mb-1 font-semibold text-foreground">
            {resolved === "correct" ? "Correct." : "Not quite."}
          </p>
          <p className="text-secondary">{explanation}</p>

          {resolved === "wrong" && (
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {replay && (
                <Link
                  href={replayHref(replay)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <RotateCcw className="size-4" aria-hidden />
                  {replay.label}
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setResolved(null);
                }}
                className="text-sm text-secondary underline-offset-2 hover:text-foreground hover:underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
