"use client";

import { cn } from "@algolens/ui";

export interface PseudocodePanelProps {
  pseudocode: string[];
  currentLine: number | null;
}

/** Pseudocode with the executing line highlighted (A2). Sync is structural — driven by step.line. */
export function PseudocodePanel({ pseudocode, currentLine }: PseudocodePanelProps) {
  return (
    <ol className="font-mono text-[13px] leading-6" aria-label="Pseudocode">
      {pseudocode.map((line, i) => {
        const active = currentLine === i + 1;
        return (
          <li
            key={i}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex gap-3 border-l-2 px-2 py-0.5 transition-colors duration-150",
              active
                ? "border-l-[var(--viz-compare)] bg-[color-mix(in_srgb,var(--viz-compare)_16%,transparent)] text-foreground"
                : "border-l-transparent text-secondary",
            )}
          >
            <span className="w-5 shrink-0 select-none text-right text-muted">{i + 1}</span>
            <span className="whitespace-pre-wrap">{line}</span>
          </li>
        );
      })}
    </ol>
  );
}
