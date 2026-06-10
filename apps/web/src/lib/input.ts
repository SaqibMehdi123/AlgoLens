import type { Json, RegistryEntry } from "@algolens/algo-core";

export type ArrayOrder = "random" | "sorted" | "reversed" | "nearly-sorted" | "few-unique";

export interface ControlState {
  size: number;
  order: ArrayOrder;
  customValues: number[] | null;
  target: number | null;
  seed: number;
}

/** Deterministic PRNG (mulberry32) so a given seed reproduces the same input — important for shareable URLs. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Bar heights in [8, 98]; may repeat (fine for sorting/searching). */
function generateValues(size: number, order: ArrayOrder, seed: number): number[] {
  const rand = rng(seed);
  const ascending = Array.from({ length: size }, (_, i) => Math.round(8 + ((i + 1) / size) * 90));
  switch (order) {
    case "sorted":
      return ascending;
    case "reversed":
      return ascending.reverse();
    case "few-unique": {
      const buckets = [18, 38, 58, 78, 96];
      return Array.from({ length: size }, () => buckets[Math.floor(rand() * buckets.length)]!);
    }
    case "nearly-sorted": {
      const a = ascending;
      const swaps = Math.max(1, Math.floor(size * 0.1));
      for (let k = 0; k < swaps; k++) {
        const i = Math.floor(rand() * size);
        const j = Math.min(size - 1, i + 1);
        [a[i], a[j]] = [a[j]!, a[i]!];
      }
      return a;
    }
    case "random":
    default:
      return shuffle(ascending, rand);
  }
}

/** Distinct values 1..size in insertion order — required for BST (unique node ids). */
function generateDistinct(size: number, order: ArrayOrder, seed: number): number[] {
  const base = Array.from({ length: size }, (_, i) => i + 1);
  if (order === "sorted") return base;
  if (order === "reversed") return base.reverse();
  return shuffle(base, rng(seed));
}

export function controlsFor(entry: RegistryEntry): {
  size: boolean;
  order: boolean;
  target: boolean;
  custom: boolean;
} {
  if (entry.layout === "graph") return { size: false, order: false, target: false, custom: false };
  if (entry.category === "tree")
    return { size: true, order: false, target: entry.key === "bst-search", custom: true };
  if (entry.category === "searching")
    return { size: true, order: entry.key !== "binary-search", target: true, custom: false };
  return { size: true, order: true, target: false, custom: true };
}

export function defaultControls(entry: RegistryEntry): ControlState {
  const base: ControlState = { size: 12, order: "random", customValues: null, target: null, seed: 1 };
  if (entry.category === "searching" || entry.key === "bst-search") {
    base.target = 23;
    base.size = entry.category === "tree" ? 9 : 12;
  }
  if (entry.category === "tree") base.size = 9;
  return base;
}

/** Build the algorithm's native input from UI control state. */
export function buildInput(entry: RegistryEntry, c: ControlState): Json {
  if (entry.layout === "graph") return entry.defaultInput();

  if (entry.category === "tree") {
    const values =
      c.customValues && c.customValues.length > 0
        ? c.customValues
        : generateDistinct(c.size, "random", c.seed);
    if (entry.key === "bst-search") {
      const target = c.target ?? values[Math.floor(values.length / 2)] ?? 0;
      return { values, target };
    }
    return values;
  }

  const arr =
    c.customValues && c.customValues.length > 0
      ? c.customValues
      : entry.key === "binary-search"
        ? generateValues(c.size, "sorted", c.seed)
        : generateValues(c.size, c.order, c.seed);

  if (entry.category === "searching") {
    const sorted = entry.key === "binary-search" ? [...arr].sort((a, b) => a - b) : arr;
    const target = c.target ?? sorted[Math.floor(sorted.length / 2)] ?? 0;
    return { array: sorted, target };
  }

  return arr;
}
