/**
 * Trace model — TRD §4.1.
 *
 * Algorithms are generator functions that yield typed {@link Step} events. They never touch the
 * DOM; the player renders a pure function of (trace, frameIndex). This is the product's moat:
 * exact backward stepping, scrubbing, speed control, shareable URLs, and deterministic tests.
 *
 * This file is the single source of truth for the Step vocabulary. Extensions beyond the literal
 * TRD §4.1 union are documented in docs/adr/0002-step-vocabulary.md:
 *   - `highlight`/`unhighlight` carry an optional semantic `role` (pivot/frontier/range/…),
 *   - tree & graph `TraceView`s let one engine drive three structurally different layouts.
 */

/** JSON-serializable value. Traces must be structured-clone-safe to support workers + share URLs. */
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/**
 * A reference to a visual element.
 * - `number` → an array index (default structure).
 * - `string` → a node id (tree/graph) or an edge id (`"u->v"`).
 */
export type Ref = number | string;

/** Semantic colouring for a highlight, mapped to the fixed palette in docs/05 §2. */
export type HighlightRole =
  | "active" // cyan  — the element under the cursor / current focus
  | "pivot" // pink  — quicksort pivot, special element
  | "frontier" // cyan  — BFS/DFS frontier (enqueued, not yet visited)
  | "range" // slate — an inactive sub-range (e.g. merge boundary)
  | "path" // mint  — a discovered path / result set
  | "special";

/** A stack frame for recursive algorithms (powers the call-stack inspector). */
export interface CallFrame {
  fn: string;
  args: Json;
}

/**
 * The typed step union. Every step carries a 1-based `line` into the algorithm's `pseudocode`
 * array; {@link assertValidLines} (and the golden-trace tests) enforce that every line is in range.
 */
export type Step =
  // Two elements are compared (amber pulse).
  | { t: "compare"; a: Ref; b: Ref; line: number }
  // Two elements exchange positions (coral arc).
  | { t: "swap"; a: Ref; b: Ref; line: number }
  // A single position is written with a new value (coral). Also reveals tree nodes.
  | { t: "set"; ref: Ref; value: Json; line: number }
  // Traversal / structure ops. `visit` = violet (visited); `enqueue` = cyan (frontier).
  | { t: "visit"; ref: Ref; line: number }
  | { t: "enqueue"; ref: Ref; line: number }
  | { t: "dequeue"; ref: Ref; line: number }
  | { t: "push"; ref: Ref; line: number }
  | { t: "pop"; ref: Ref; line: number }
  // Permanent "this is in its final sorted position" marker (mint + check tick).
  | { t: "markSorted"; refs: Ref[]; line: number }
  // Transient emphasis with optional semantic role.
  | { t: "highlight"; refs: Ref[]; role?: HighlightRole; line: number }
  | { t: "unhighlight"; refs: Ref[]; line: number }
  // Call-stack push/pop for recursion visualisation.
  | { t: "callPush"; frame: CallFrame; line: number }
  | { t: "callPop"; frame: CallFrame; line: number }
  // Human-readable "why" narration; also feeds the aria-live caption.
  | { t: "annotate"; text: string; line: number }
  // Snapshot of named variables for the inspector (flash-on-change in the UI).
  | { t: "vars"; values: Record<string, Json>; line: number };

/** The discriminant strings of {@link Step}. */
export type StepType = Step["t"];

// --- Initial visual structure -------------------------------------------------------------------

export interface TreeNodeInit {
  id: string;
  value: number;
  parent: string | null;
  side?: "left" | "right";
  /** Whether the node is shown from frame 0 (search) or revealed by a `set` step (insert). */
  present?: boolean;
}

export interface GraphNodeInit {
  id: string;
  label?: string;
  /** Normalised preset position in [0,1] for deterministic, force-free layout. */
  x: number;
  y: number;
}

export interface GraphEdgeInit {
  id: string;
  from: string;
  to: string;
  weight?: number;
}

/**
 * The initial state a renderer seeds from. The player derives the state at frame `i` by folding
 * steps `0..i` over this — so the view is always the state *before* the first step.
 */
export type TraceView =
  | { kind: "array"; values: number[]; needle?: number }
  | { kind: "tree"; nodes: TreeNodeInit[] }
  | { kind: "graph"; directed: boolean; nodes: GraphNodeInit[]; edges: GraphEdgeInit[]; needle?: number };

/** A recorded run: everything the player needs, fully serialized and deterministic. */
export interface Trace {
  algo: string;
  input: Json;
  view: TraceView;
  steps: Step[];
  /** 1-based-friendly pseudocode lines; `step.line` indexes into this (1 = first line). */
  pseudocode: string[];
  meta: {
    counts: Partial<Record<StepType, number>>;
    /** True if recording hit a step/time cap before the generator finished. */
    capped: boolean;
    stepCount: number;
  };
}
