import { AlertTriangle, Lightbulb, Wrench } from "lucide-react";
import type { ReactNode } from "react";

const KINDS = {
  insight: { icon: Lightbulb, label: "Insight", accent: "var(--viz-sorted)" },
  warning: { icon: AlertTriangle, label: "Warning", accent: "var(--viz-compare)" },
  tryit: { icon: Wrench, label: "Try it", accent: "var(--viz-frontier)" },
} as const;

export interface CalloutProps {
  kind?: keyof typeof KINDS;
  children: ReactNode;
}

/** Lesson callout (docs/05 §4: Insight / Warning / Try-it). */
export function Callout({ kind = "insight", children }: CalloutProps) {
  const { icon: Icon, label, accent } = KINDS[kind] ?? KINDS.insight;
  return (
    <aside
      className="my-6 rounded-xl border border-subtle bg-surface p-4 not-prose"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>
        <Icon className="size-4" aria-hidden />
        {label}
      </p>
      <div className="text-sm leading-relaxed text-secondary [&_code]:font-mono [&_code]:text-foreground [&_strong]:text-foreground">
        {children}
      </div>
    </aside>
  );
}
