import { AlertTriangle, Lightbulb, Wrench } from "lucide-react";
import type { ReactNode } from "react";

const KINDS = {
  insight: { icon: Lightbulb, label: "Insight", color: "var(--primary)", onColor: "#ffffff" },
  warning: { icon: AlertTriangle, label: "Warning", color: "var(--viz-frontier)", onColor: "#0a0c12" },
  tryit: { icon: Wrench, label: "Try it", color: "var(--viz-sorted)", onColor: "#0a0c12" },
} as const;

export interface CalloutProps {
  kind?: keyof typeof KINDS;
  children: ReactNode;
}

/** Lesson callout (design comp): filled tint, colored icon chip, mono label (Insight / Warning / Try-it). */
export function Callout({ kind = "insight", children }: CalloutProps) {
  const { icon: Icon, label, color, onColor } = KINDS[kind] ?? KINDS.insight;
  return (
    <aside
      className="not-prose my-6 flex gap-3.5 rounded-xl border p-4"
      style={{ borderColor: color, background: `color-mix(in srgb, ${color} 10%, transparent)` }}
    >
      <span
        className="grid size-6 shrink-0 place-items-center rounded-[7px]"
        style={{ background: color, color: onColor }}
      >
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div>
        <p className="mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
          {label}
        </p>
        <div className="text-[15px] leading-relaxed text-secondary [&_a]:font-semibold [&_a]:text-primary [&_code]:font-mono [&_code]:text-foreground [&_strong]:text-foreground">
          {children}
        </div>
      </div>
    </aside>
  );
}
