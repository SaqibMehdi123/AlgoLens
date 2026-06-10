import { annotate, cmp, markSorted, swap, vars } from "../trace/emit";
import type { Step } from "../trace/step";
import type { AlgorithmSpec } from "../types";

const pseudocode = [
  "build max-heap from a", // 1
  "for end ← n−1 down to 1", // 2
  "  swap a[0] and a[end]", // 3
  "  mark a[end] as sorted", // 4
  "  sift down root within a[0..end)", // 5
  "siftDown(k, size):", // 6
  "  l ← 2k+1; r ← 2k+2; max ← k", // 7
  "  if a[l] > a[max]: max ← l", // 8
  "  if a[r] > a[max]: max ← r", // 9
  "  if max ≠ k: swap a[k],a[max]; recurse", // 10
];

function* siftDown(a: number[], k: number, size: number): Generator<Step> {
  const l = 2 * k + 1;
  const r = 2 * k + 2;
  let max = k;
  yield vars({ k, l, r }, 7);
  if (l < size) {
    yield cmp(l, max, 8);
    if (a[l]! > a[max]!) max = l;
  }
  if (r < size) {
    yield cmp(r, max, 9);
    if (a[r]! > a[max]!) max = r;
  }
  if (max !== k) {
    [a[k], a[max]] = [a[max]!, a[k]!];
    yield swap(k, max, 10);
    yield* siftDown(a, max, size);
  }
}

export function* heapSort(a: number[]): Generator<Step> {
  const n = a.length;
  yield annotate("build a max-heap", 1);
  for (let k = Math.floor(n / 2) - 1; k >= 0; k--) {
    yield* siftDown(a, k, n);
  }
  for (let end = n - 1; end >= 1; end--) {
    yield vars({ end }, 2);
    [a[0], a[end]] = [a[end]!, a[0]!];
    yield swap(0, end, 3);
    yield markSorted([end], 4);
    yield* siftDown(a, 0, end);
  }
  if (n > 0) yield markSorted([0], 5);
}

export const heapSortSpec: AlgorithmSpec<number[]> = {
  key: "heap-sort",
  title: "Heap Sort",
  category: "sorting",
  layout: "array",
  pseudocode,
  complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(1)" },
  maxInputSize: 200,
  defaultInput: () => [5, 3, 8, 4, 2, 7, 1, 6],
  buildView: (input) => ({ kind: "array", values: input.slice() }),
  run: heapSort,
};
