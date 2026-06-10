"use client";

import type { RegistryEntry } from "@algolens/algo-core";
import { Button } from "@algolens/ui";
import { Shuffle } from "lucide-react";
import { useState } from "react";
import { controlsFor, type ArrayOrder, type ControlState } from "@/lib/input";

const ORDERS: { value: ArrayOrder; label: string }[] = [
  { value: "random", label: "Random" },
  { value: "sorted", label: "Sorted" },
  { value: "reversed", label: "Reversed" },
  { value: "nearly-sorted", label: "Nearly sorted" },
  { value: "few-unique", label: "Few unique" },
];

const fieldCls =
  "rounded-lg border border-subtle bg-raised px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export interface InputControlsProps {
  entry: RegistryEntry;
  controls: ControlState;
  onChange: (next: Partial<ControlState>) => void;
}

export function InputControls({ entry, controls, onChange }: InputControlsProps) {
  const show = controlsFor(entry);
  const [customText, setCustomText] = useState("");

  if (!show.size && !show.order && !show.target && !show.custom) {
    return (
      <p className="text-sm text-muted">
        Preset graph — use the transport controls below to explore the traversal.
      </p>
    );
  }

  const maxSize = Math.min(entry.maxInputSize, entry.category === "tree" ? 15 : 64);

  function commitCustom() {
    const parsed = customText
      .split(/[,\s]+/)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n));
    onChange({ customValues: parsed.length > 0 ? parsed : null });
  }

  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
      {show.size && !controls.customValues && (
        <label className="flex flex-col gap-1 text-xs text-secondary">
          <span>
            Size: <span className="font-mono text-foreground">{controls.size}</span>
          </span>
          <input
            type="range"
            min={3}
            max={maxSize}
            value={controls.size}
            onChange={(e) => onChange({ size: Number(e.target.value) })}
            className="w-36 accent-[var(--primary)]"
            aria-label="Input size"
          />
        </label>
      )}

      {show.order && !controls.customValues && (
        <label className="flex flex-col gap-1 text-xs text-secondary">
          <span>Order</span>
          <select
            value={controls.order}
            onChange={(e) => onChange({ order: e.target.value as ArrayOrder })}
            className={fieldCls}
            aria-label="Initial order"
          >
            {ORDERS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {show.target && (
        <label className="flex flex-col gap-1 text-xs text-secondary">
          <span>Target</span>
          <input
            type="number"
            value={controls.target ?? ""}
            onChange={(e) => onChange({ target: e.target.value === "" ? null : Number(e.target.value) })}
            className={`${fieldCls} w-24 font-mono`}
            aria-label="Search target"
          />
        </label>
      )}

      {show.custom && (
        <label className="flex flex-col gap-1 text-xs text-secondary">
          <span>Custom values (comma-separated)</span>
          <input
            type="text"
            value={customText}
            placeholder={controls.customValues ? controls.customValues.join(", ") : "e.g. 5, 3, 8, 1"}
            onChange={(e) => setCustomText(e.target.value)}
            onBlur={commitCustom}
            onKeyDown={(e) => e.key === "Enter" && commitCustom()}
            className={`${fieldCls} w-48 font-mono`}
            aria-label="Custom values"
          />
        </label>
      )}

      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setCustomText("");
          onChange({ seed: Math.floor(Math.random() * 1e9), customValues: null });
        }}
      >
        <Shuffle />
        Randomize
      </Button>
    </div>
  );
}
