"use client";

import { cn } from "@algolens/ui";

export interface LiveRegionProps {
  caption: string | null;
  reducedMotion: boolean;
  onToggleReduced: () => void;
}

/**
 * Accessibility surface (X4 / docs/05 §6): a polite aria-live region narrates each step for screen
 * readers, and an explicit reduced-motion toggle swaps tweens for discrete snapshots + captions.
 */
export function LiveRegion({ caption, reducedMotion, onToggleReduced }: LiveRegionProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <p
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "min-h-[1.5rem] font-mono text-xs",
          reducedMotion ? "text-foreground" : "text-secondary",
        )}
      >
        {caption ?? "Ready."}
      </p>
      <label className="flex shrink-0 items-center gap-2 text-xs text-secondary">
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={onToggleReduced}
          className="accent-[var(--primary)]"
        />
        Reduced motion
      </label>
    </div>
  );
}
