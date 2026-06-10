/** Algorithm catalog metadata + the contract every visualizable algorithm implements. */
import type { Json, Step, TraceView } from "./trace/step";

export type AlgoCategory = "sorting" | "searching" | "tree" | "graph" | "list" | "dp" | "hashing";

/** Which renderer drives this algorithm's scene. One engine, many layouts (TRD §4.2). */
export type LayoutKind = "array" | "tree" | "graph" | "grid" | "list" | "hashtable";

export interface ComplexityMeta {
  best: string;
  average: string;
  worst: string;
  space: string;
}

/**
 * A self-contained, visualizable algorithm. `run` is the pure generator; `buildView` produces the
 * initial scene the player folds steps over. Both receive a private copy of the input (the recorder
 * clones), so `run` may mutate freely in the TRD's in-place style.
 */
export interface AlgorithmSpec<I = Json> {
  key: string;
  title: string;
  category: AlgoCategory;
  layout: LayoutKind;
  /** Pseudocode lines; `Step.line` is 1-based into this array. */
  pseudocode: string[];
  complexity: ComplexityMeta;
  /** Hard cap on input size; enforced by the recorder + UI input controls. */
  maxInputSize: number;
  /** A representative input for the catalog thumbnail and golden-trace tests. */
  defaultInput: () => I;
  buildView: (input: I) => TraceView;
  run: (input: I) => Generator<Step>;
}
