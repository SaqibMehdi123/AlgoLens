"use client";

import type { CallFrame, ComplexityMeta, Json } from "@algolens/algo-core";
import { cn } from "@algolens/ui";
import { useState } from "react";
import { PseudocodePanel } from "./pseudocode-panel";
import { VariableInspector } from "./variable-inspector";

type Tab = "pseudocode" | "variables" | "about";

const LEGEND: { token: string; label: string }[] = [
  { token: "--viz-compare", label: "compare" },
  { token: "--viz-swap", label: "swap / write" },
  { token: "--viz-sorted", label: "sorted / found" },
  { token: "--viz-visited", label: "visited" },
  { token: "--viz-frontier", label: "frontier / active" },
  { token: "--viz-pivot", label: "pivot" },
];

export interface RightRailProps {
  title: string;
  category: string;
  complexity: ComplexityMeta;
  pseudocode: string[];
  currentLine: number | null;
  vars: Record<string, Json>;
  callStack: CallFrame[];
  annotation: string | null;
}

export function RightRail(props: RightRailProps) {
  const [tab, setTab] = useState<Tab>("pseudocode");
  const tabs: { id: Tab; label: string }[] = [
    { id: "pseudocode", label: "Pseudocode" },
    { id: "variables", label: "Variables" },
    { id: "about", label: "About" },
  ];

  return (
    <div className="flex h-full flex-col rounded-xl border border-subtle bg-surface">
      <div role="tablist" className="flex shrink-0 border-b border-subtle p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-sm transition-colors",
              tab === t.id
                ? "bg-raised text-foreground"
                : "text-secondary hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-[280px] flex-1 overflow-auto p-3">
        {tab === "pseudocode" && (
          <PseudocodePanel pseudocode={props.pseudocode} currentLine={props.currentLine} />
        )}
        {tab === "variables" && (
          <VariableInspector
            vars={props.vars}
            callStack={props.callStack}
            annotation={props.annotation}
          />
        )}
        {tab === "about" && (
          <div className="flex flex-col gap-5 text-sm">
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                Complexity
              </h3>
              <table className="w-full font-mono text-xs">
                <tbody>
                  {(
                    [
                      ["Best", props.complexity.best],
                      ["Average", props.complexity.average],
                      ["Worst", props.complexity.worst],
                      ["Space", props.complexity.space],
                    ] as const
                  ).map(([k, v]) => (
                    <tr key={k} className="border-b border-subtle last:border-0">
                      <td className="py-1.5 text-secondary">{k}</td>
                      <td className="py-1.5 text-right text-foreground">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Legend</h3>
              <ul className="flex flex-col gap-1.5">
                {LEGEND.map((l) => (
                  <li key={l.token} className="flex items-center gap-2 text-xs text-secondary">
                    <span
                      className="size-3 rounded-sm"
                      style={{ backgroundColor: `var(${l.token})` }}
                    />
                    {l.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
