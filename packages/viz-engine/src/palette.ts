/**
 * The semantic visualization palette (docs/05 §2) — fixed meanings everywhere. Renderers reference
 * CSS variables (defined in the web theme) rather than hard-coding hex, so a single token sheet
 * governs lessons, the playground, charts, and verdict badges alike.
 */
import type { ElementStatus } from "./state/visual-state";

export const STATUS_TOKEN: Record<ElementStatus, string> = {
  default: "var(--viz-bar)",
  comparing: "var(--viz-compare)", // amber
  swapping: "var(--viz-swap)", // coral
  writing: "var(--viz-swap)", // coral
  sorted: "var(--viz-sorted)", // mint
  pivot: "var(--viz-pivot)", // pink
  active: "var(--viz-frontier)", // cyan (active = frontier hue)
  frontier: "var(--viz-frontier)", // cyan
  visited: "var(--viz-visited)", // violet
  range: "var(--viz-range)", // slate (inactive)
};

/** Whether a status should also carry a non-colour cue (docs/05: never encode state by colour alone). */
export const STATUS_MARK: Partial<Record<ElementStatus, string>> = {
  sorted: "✓",
  pivot: "◆",
  visited: "•",
};

export const STATUS_LABEL: Record<ElementStatus, string> = {
  default: "",
  comparing: "comparing",
  swapping: "swapping",
  writing: "writing",
  sorted: "sorted",
  pivot: "pivot",
  active: "active",
  frontier: "in frontier",
  visited: "visited",
  range: "in range",
};
