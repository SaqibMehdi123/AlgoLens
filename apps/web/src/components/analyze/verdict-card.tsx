"use client";

import type { Verdict } from "@algolens/complexity";
import { cn } from "@algolens/ui";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const CONFIDENCE_DOT: Record<Verdict["confidence"], string> = {
  high: "var(--viz-sorted)",
  medium: "var(--viz-compare)",
  low: "var(--muted-fg)",
};

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-subtle bg-raised px-3 py-1.5">
      <span className="text-xs text-secondary">{label}</span>
      <span className="font-mono text-sm font-semibold text-foreground">{value}</span>
    </span>
  );
}

/**
 * Verdict / divergence card (docs/05 §5.4). Disagreement is a designed state — the divergence
 * card presents both witnesses with reasons, never silently preferring one.
 */
export function VerdictCard({ verdict }: { verdict: Verdict }) {
  if (verdict.mode === "diverge") {
    return (
      <section className="rounded-xl border border-[var(--viz-compare)]/50 bg-[color-mix(in_srgb,var(--viz-compare)_7%,transparent)] p-5" role="status">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <AlertTriangle className="size-4 text-compare" aria-hidden />
          The two layers disagree — both shown
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {verdict.staticBigO && <Chip label="static analysis" value={verdict.staticBigO} />}
          {verdict.empiricalBigO && <Chip label="measured fit" value={verdict.empiricalBigO} />}
        </div>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm text-secondary">
          {verdict.reasons.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="text-compare">·</span>
              {r}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-subtle bg-surface p-5" role="status">
      <div className="flex flex-wrap items-center gap-3">
        {verdict.final && (
          <span className="font-mono text-2xl font-bold text-foreground">{verdict.final}</span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-raised px-2.5 py-1 text-xs text-secondary">
          <span className="size-2 rounded-full" style={{ backgroundColor: CONFIDENCE_DOT[verdict.confidence] }} aria-hidden />
          confidence {verdict.confidence.toUpperCase()}
        </span>
        {verdict.mode === "agree" && (
          <span className="inline-flex items-center gap-1 text-xs text-sorted">
            <CheckCircle2 className="size-3.5" aria-hidden />
            static + empirical agree
          </span>
        )}
      </div>
      {verdict.reasons.length > 0 && (
        <ul className={cn("mt-2 text-xs text-muted")}>
          {verdict.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Why this can be wrong: exact general-case analysis is undecidable, and empirical fits
        reflect this input family only — constants, JIT warm-up, and caches can fool small-n runs.
      </p>
    </section>
  );
}
