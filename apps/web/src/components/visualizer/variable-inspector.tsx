"use client";

import type { CallFrame, Json } from "@algolens/algo-core";

export interface VariableInspectorProps {
  vars: Record<string, Json>;
  callStack: CallFrame[];
  annotation: string | null;
}

/** Variable & state inspector incl. the call stack for recursive algorithms (A3). */
export function VariableInspector({ vars, callStack, annotation }: VariableInspectorProps) {
  const entries = Object.entries(vars);
  return (
    <div className="flex flex-col gap-4">
      {annotation && (
        <p className="rounded-lg border border-subtle bg-raised px-3 py-2 text-sm text-secondary">
          {annotation}
        </p>
      )}

      <section>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Variables</h3>
        {entries.length === 0 ? (
          <p className="text-sm text-muted">No variables yet — step forward to begin.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center gap-1.5 rounded-lg border border-subtle bg-raised px-2.5 py-1 font-mono text-xs"
              >
                <span className="text-secondary">{key}</span>
                <span className="text-muted">=</span>
                <span className="text-foreground">{JSON.stringify(value)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {callStack.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Call stack</h3>
          <ul className="flex flex-col-reverse gap-1">
            {callStack.map((frame, i) => (
              <li
                key={i}
                className="rounded-lg border border-subtle bg-raised px-2.5 py-1 font-mono text-xs text-foreground"
                style={{ marginLeft: i * 8 }}
              >
                {frame.fn}({JSON.stringify(frame.args).slice(1, -1)})
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
