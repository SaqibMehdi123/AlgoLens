/**
 * deriveState — the pure heart of the player (TRD §4.2): `render` is a function of
 * `(trace, frameIndex)`. The visual state at frame `f` is computed by folding steps `0..f-1` over
 * the trace's initial view, with transient emphasis (compare/swap/write) taken from step `f-1`.
 *
 * Because it is pure and re-derivable, backward stepping is *exact* — there is no incremental state
 * to drift. Stepping back is just `deriveState(trace, f-1)`.
 *
 * Frame convention: `frame ∈ [0, steps.length]`. Frame 0 is the initial state (no steps applied);
 * frame `f ≥ 1` shows the result of step `f-1` and highlights `pseudocode[step.line]`.
 */
import type {
  CallFrame,
  GraphEdgeInit,
  GraphNodeInit,
  HighlightRole,
  Json,
  Ref,
  Trace,
  TreeNodeInit,
} from "@algolens/algo-core";

export type ElementStatus =
  | "default"
  | "comparing"
  | "swapping"
  | "writing"
  | "sorted"
  | "pivot"
  | "active"
  | "frontier"
  | "visited"
  | "range";

export interface TreeNodeState extends TreeNodeInit {
  present: boolean;
}

export interface VisualState {
  kind: "array" | "tree" | "graph";
  values: number[];
  needle: number | null;
  treeNodes: TreeNodeState[];
  graphNodes: GraphNodeInit[];
  graphEdges: GraphEdgeInit[];
  directed: boolean;
  // persistent status sets
  sorted: Set<Ref>;
  visited: Set<string>;
  frontier: Set<string>;
  highlights: Map<HighlightRole, Set<Ref>>;
  // transient — reflect the current frame's step only
  comparing: Ref[];
  swapping: Ref[];
  writing: Ref[];
  // inspector
  vars: Record<string, Json>;
  annotation: string | null;
  callStack: CallFrame[];
  // pointer
  frame: number;
  totalFrames: number;
  currentLine: number | null;
}

/** Total number of frames in a trace (steps + the initial frame 0). */
export function frameCount(trace: Trace): number {
  return trace.steps.length;
}

export function clampFrame(trace: Trace, frame: number): number {
  return Math.max(0, Math.min(frame, trace.steps.length));
}

function emptyHighlights(): Map<HighlightRole, Set<Ref>> {
  return new Map();
}

function removeFromAll(highlights: Map<HighlightRole, Set<Ref>>, refs: Ref[]): void {
  for (const set of highlights.values()) for (const r of refs) set.delete(r);
}

export function deriveState(trace: Trace, frame: number): VisualState {
  const f = clampFrame(trace, frame);
  const view = trace.view;

  const state: VisualState = {
    kind: view.kind,
    values: view.kind === "array" ? [...view.values] : [],
    needle: view.kind === "array" || view.kind === "graph" ? (view.needle ?? null) : null,
    treeNodes:
      view.kind === "tree"
        ? view.nodes.map((n) => ({ ...n, present: n.present ?? true }))
        : [],
    graphNodes: view.kind === "graph" ? view.nodes.map((n) => ({ ...n })) : [],
    graphEdges: view.kind === "graph" ? view.edges.map((e) => ({ ...e })) : [],
    directed: view.kind === "graph" ? view.directed : false,
    sorted: new Set(),
    visited: new Set(),
    frontier: new Set(),
    highlights: emptyHighlights(),
    comparing: [],
    swapping: [],
    writing: [],
    vars: {},
    annotation: null,
    callStack: [],
    frame: f,
    totalFrames: trace.steps.length,
    currentLine: f >= 1 ? (trace.steps[f - 1]?.line ?? null) : null,
  };

  for (let k = 0; k < f; k++) {
    const step = trace.steps[k]!;
    switch (step.t) {
      case "swap": {
        if (typeof step.a === "number" && typeof step.b === "number") {
          const { a, b } = step;
          [state.values[a], state.values[b]] = [state.values[b]!, state.values[a]!];
        }
        break;
      }
      case "set": {
        if (typeof step.ref === "number") {
          state.values[step.ref] = step.value as number;
        } else {
          const node = state.treeNodes.find((n) => n.id === step.ref);
          if (node) node.present = true;
        }
        break;
      }
      case "visit":
        state.visited.add(String(step.ref));
        break;
      case "enqueue":
      case "push":
        state.frontier.add(String(step.ref));
        break;
      case "dequeue":
      case "pop":
        state.frontier.delete(String(step.ref));
        break;
      case "markSorted":
        for (const r of step.refs) state.sorted.add(r);
        break;
      case "highlight": {
        const role: HighlightRole = step.role ?? "active";
        state.highlights.set(role, new Set(step.refs));
        break;
      }
      case "unhighlight":
        removeFromAll(state.highlights, step.refs);
        break;
      case "callPush":
        state.callStack.push(step.frame);
        break;
      case "callPop":
        state.callStack.pop();
        break;
      case "annotate":
        state.annotation = step.text;
        break;
      case "vars":
        state.vars = { ...state.vars, ...step.values };
        break;
      // compare carries no persistent state — it is transient only.
      case "compare":
        break;
    }
  }

  // Transient emphasis comes from the current step (f - 1) only, so a compare flashes for one frame.
  if (f >= 1) {
    const cur = trace.steps[f - 1]!;
    if (cur.t === "compare") state.comparing = [cur.a, cur.b];
    else if (cur.t === "swap") state.swapping = [cur.a, cur.b];
    else if (cur.t === "set") state.writing = [cur.ref];
  }

  return state;
}

const STATUS_PRIORITY: ElementStatus[] = [
  "writing",
  "swapping",
  "comparing",
  "sorted",
  "pivot",
  "active",
  "frontier",
  "visited",
  "range",
];

function inHighlight(state: VisualState, role: HighlightRole, ref: Ref): boolean {
  return state.highlights.get(role)?.has(ref) ?? false;
}

/** Resolve the single winning status of an element by fixed priority (TRD palette semantics). */
export function elementStatus(state: VisualState, ref: Ref): ElementStatus {
  const has: Record<ElementStatus, boolean> = {
    default: true,
    writing: state.writing.includes(ref),
    swapping: state.swapping.includes(ref),
    comparing: state.comparing.includes(ref),
    sorted: state.sorted.has(ref),
    pivot: inHighlight(state, "pivot", ref),
    active: inHighlight(state, "active", ref),
    frontier: state.frontier.has(String(ref)) || inHighlight(state, "frontier", ref),
    visited: state.visited.has(String(ref)),
    range: inHighlight(state, "range", ref),
  };
  for (const status of STATUS_PRIORITY) if (has[status]) return status;
  return "default";
}

/** Whether an edge id is currently highlighted (any role) — used by the graph renderer. */
export function edgeActive(state: VisualState, edgeId: string): boolean {
  for (const set of state.highlights.values()) if (set.has(edgeId)) return true;
  return false;
}
