/**
 * The algorithm registry: the single catalog the web app reads to list, record, and visualize
 * algorithms. Each generic {@link AlgorithmSpec}<I> is erased to a uniform {@link RegistryEntry}
 * by {@link toEntry}, so heterogeneous input types coexist without `any`.
 */
import { recordTrace, type RecordOptions } from "./trace/recorder";
import type { Json, Trace } from "./trace/step";
import type { AlgoCategory, AlgorithmSpec, ComplexityMeta, LayoutKind } from "./types";

import {
  bubbleSortSpec,
  heapSortSpec,
  insertionSortSpec,
  mergeSortSpec,
  quickSortSpec,
  selectionSortSpec,
} from "./sorting";
import { binarySearchSpec, linearSearchSpec } from "./searching";
import { bstInsertSpec, bstSearchSpec } from "./trees";
import { bfsSpec, dfsSpec } from "./graphs";

export interface RegistryEntry {
  key: string;
  title: string;
  category: AlgoCategory;
  layout: LayoutKind;
  pseudocode: string[];
  complexity: ComplexityMeta;
  maxInputSize: number;
  /** A fresh copy of the representative input (safe to mutate in UI controls). */
  defaultInput: () => Json;
  /** Record a trace from `input` (defaults to {@link defaultInput}). */
  record: (input?: Json, options?: RecordOptions) => Trace;
}

function toEntry<I>(spec: AlgorithmSpec<I>): RegistryEntry {
  return {
    key: spec.key,
    title: spec.title,
    category: spec.category,
    layout: spec.layout,
    pseudocode: spec.pseudocode,
    complexity: spec.complexity,
    maxInputSize: spec.maxInputSize,
    defaultInput: () => spec.defaultInput() as Json,
    record: (input, options) =>
      recordTrace(spec, input === undefined ? spec.defaultInput() : (input as I), options),
  };
}

export const registry: RegistryEntry[] = [
  toEntry(bubbleSortSpec),
  toEntry(insertionSortSpec),
  toEntry(selectionSortSpec),
  toEntry(mergeSortSpec),
  toEntry(quickSortSpec),
  toEntry(heapSortSpec),
  toEntry(linearSearchSpec),
  toEntry(binarySearchSpec),
  toEntry(bstInsertSpec),
  toEntry(bstSearchSpec),
  toEntry(bfsSpec),
  toEntry(dfsSpec),
];

export const registryByKey: ReadonlyMap<string, RegistryEntry> = new Map(
  registry.map((entry) => [entry.key, entry]),
);

export function getAlgo(key: string): RegistryEntry | undefined {
  return registryByKey.get(key);
}

export const CATEGORY_ORDER: AlgoCategory[] = [
  "sorting",
  "searching",
  "tree",
  "graph",
  "list",
  "hashing",
  "dp",
];

export const CATEGORY_LABELS: Record<AlgoCategory, string> = {
  sorting: "Sorting",
  searching: "Searching",
  tree: "Trees",
  graph: "Graphs",
  list: "Linked Lists",
  hashing: "Hashing",
  dp: "Dynamic Programming",
};

/** Group the catalog by category, preserving {@link CATEGORY_ORDER}. */
export function groupByCategory(): { category: AlgoCategory; entries: RegistryEntry[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    entries: registry.filter((entry) => entry.category === category),
  })).filter((group) => group.entries.length > 0);
}
