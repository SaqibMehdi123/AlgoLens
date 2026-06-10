import type { VisualState } from "../state/visual-state";
import { ArrayBars } from "./array-bars";
import { GraphView } from "./graph-view";
import { TreeView } from "./tree-view";

export interface SceneProps {
  state: VisualState;
  animate?: boolean;
  className?: string;
}

/** Dispatches to the renderer for the trace's layout — one engine, three layouts (TRD §4.2). */
export function Scene({ state, animate = true, className }: SceneProps) {
  switch (state.kind) {
    case "array":
      return <ArrayBars state={state} animate={animate} className={className} />;
    case "tree":
      return <TreeView state={state} animate={animate} className={className} />;
    case "graph":
      return <GraphView state={state} animate={animate} className={className} />;
  }
}
