import { annotate, callPop, callPush, cmp, markSorted, setVal, vars } from "../trace/emit";
import type { Step } from "../trace/step";
import type { AlgorithmSpec } from "../types";

const pseudocode = [
  "sort(lo, hi):", // 1
  "  if hi − lo ≤ 1: return", // 2
  "  mid ← ⌊(lo + hi) / 2⌋", // 3
  "  sort(lo, mid)", // 4
  "  sort(mid, hi)", // 5
  "  merge a[lo..mid) with a[mid..hi)", // 6
  "    compare fronts, take smaller", // 7
  "    write merged values into a[lo..hi)", // 8
];

function* sort(a: number[], lo: number, hi: number): Generator<Step> {
  yield callPush({ fn: "sort", args: { lo, hi } }, 1);
  if (hi - lo <= 1) {
    yield annotate(hi - lo <= 0 ? "empty range" : `a[${lo}] is trivially sorted`, 2);
    yield callPop({ fn: "sort", args: { lo, hi } }, 2);
    return;
  }
  const mid = Math.floor((lo + hi) / 2);
  yield vars({ lo, mid, hi }, 3);

  yield* sort(a, lo, mid);
  yield* sort(a, mid, hi);

  // Merge: compare fronts against the (unmodified) array, collecting a source-index order...
  yield annotate(`merge [${lo},${mid}) and [${mid},${hi})`, 6);
  const order: number[] = [];
  let i = lo;
  let j = mid;
  while (i < mid && j < hi) {
    yield cmp(i, j, 7);
    if (a[i]! <= a[j]!) order.push(i++);
    else order.push(j++);
  }
  while (i < mid) order.push(i++);
  while (j < hi) order.push(j++);

  // ...then write the merged values back. Capture values before mutating so reads stay valid.
  const merged = order.map((idx) => a[idx]!);
  for (let k = 0; k < merged.length; k++) {
    a[lo + k] = merged[k]!;
    yield setVal(lo + k, merged[k]!, 8);
  }
  yield callPop({ fn: "sort", args: { lo, hi } }, 8);
}

export function* mergeSort(a: number[]): Generator<Step> {
  yield* sort(a, 0, a.length);
  if (a.length > 0) {
    yield markSorted(
      Array.from({ length: a.length }, (_, k) => k),
      8,
    );
  }
}

export const mergeSortSpec: AlgorithmSpec<number[]> = {
  key: "merge-sort",
  title: "Merge Sort",
  category: "sorting",
  layout: "array",
  pseudocode,
  complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)" },
  maxInputSize: 200,
  defaultInput: () => [5, 3, 8, 4, 2, 7, 1, 6],
  buildView: (input) => ({ kind: "array", values: input.slice() }),
  run: mergeSort,
};
