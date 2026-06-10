"use client";

import type { StaticResult } from "@algolens/complexity";
import { cn } from "@algolens/ui";

/**
 * Annotated source (docs/05 §5.4): code with line numbers; lines carrying static-analysis
 * notes get an amber gutter highlight with the note inline. Unresolved items listed below —
 * "static analysis is partial" is stated, never hidden.
 */
export function AnnotatedSource({ code, result }: { code: string; result: StaticResult }) {
  const notesByLine = new Map<number, string[]>();
  for (const a of result.annotations) {
    notesByLine.set(a.line, [...(notesByLine.get(a.line) ?? []), a.note]);
  }
  const lines = code.split("\n");

  return (
    <section className="rounded-xl border border-subtle bg-surface p-4">
      <h3 className="mb-3 text-sm font-medium text-foreground">Annotated source</h3>
      <ol className="overflow-x-auto font-mono text-[13px] leading-6">
        {lines.map((text, i) => {
          const notes = notesByLine.get(i + 1);
          return (
            <li
              key={i}
              className={cn(
                "flex gap-3 border-l-2 px-2",
                notes
                  ? "border-l-[var(--viz-compare)] bg-[color-mix(in_srgb,var(--viz-compare)_10%,transparent)]"
                  : "border-l-transparent",
              )}
            >
              <span className="w-6 shrink-0 select-none text-right text-muted">{i + 1}</span>
              <span className="whitespace-pre text-foreground">{text || " "}</span>
              {notes && (
                <span className="ml-auto shrink-0 pl-4 text-xs italic text-compare">
                  {notes.join(" · ")}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {result.unresolved.length > 0 && (
        <div className="mt-3 rounded-lg border border-subtle bg-raised p-3 text-xs text-secondary">
          <p className="mb-1 font-semibold text-foreground">Static analysis is partial here:</p>
          <ul className="flex flex-col gap-1">
            {result.unresolved.map((u) => (
              <li key={u}>· {u}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
