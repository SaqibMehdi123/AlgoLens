import { callPop, callPush, cmp, highlight, markSorted, swap, unhighlight, vars } from "../trace/emit";
import type { Step } from "../trace/step";
import type { AlgorithmSpec } from "../types";

const pseudocode = [
  "quicksort(lo, hi):", // 1
  "  if lo ≥ hi: return", // 2
  "  pivot ← a[hi]", // 3
  "  i ← lo − 1", // 4
  "  for j ← lo to hi−1", // 5
  "    if a[j] < pivot", // 6
  "      i ← i + 1; swap a[i], a[j]", // 7
  "  swap a[i+1] and a[hi]  (place pivot)", // 8
  "  quicksort(lo, i); quicksort(i+2, hi)", // 9
];

function* quicksort(a: number[], lo: number, hi: number): Generator<Step> {
  yield callPush({ fn: "quicksort", args: { lo, hi } }, 1);
  if (lo >= hi) {
    if (lo === hi) yield markSorted([lo], 2);
    yield callPop({ fn: "quicksort", args: { lo, hi } }, 2);
    return;
  }
  const pivotValue = a[hi]!;
  yield highlight([hi], 3, "pivot");
  yield vars({ pivot: pivotValue }, 3);
  let i = lo - 1;
  yield vars({ i }, 4);
  for (let j = lo; j < hi; j++) {
    yield vars({ j }, 5);
    yield cmp(j, hi, 6);
    if (a[j]! < pivotValue) {
      i++;
      if (i !== j) {
        [a[i], a[j]] = [a[j]!, a[i]!];
        yield swap(i, j, 7);
      }
      yield vars({ i }, 7);
    }
  }
  const p = i + 1;
  if (p !== hi) {
    [a[p], a[hi]] = [a[hi]!, a[p]!];
    yield swap(p, hi, 8);
  }
  yield unhighlight([hi], 8);
  yield markSorted([p], 8);

  yield* quicksort(a, lo, p - 1);
  yield* quicksort(a, p + 1, hi);
  yield callPop({ fn: "quicksort", args: { lo, hi } }, 9);
}

export function* quickSort(a: number[]): Generator<Step> {
  yield* quicksort(a, 0, a.length - 1);
}

export const quickSortSpec: AlgorithmSpec<number[]> = {
  key: "quick-sort",
  title: "Quick Sort",
  category: "sorting",
  layout: "array",
  pseudocode,
  complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n²)", space: "O(log n)" },
  maxInputSize: 200,
  defaultInput: () => [5, 3, 8, 4, 2, 7, 1, 6],
  buildView: (input) => ({ kind: "array", values: input.slice() }),
  run: quickSort,
};
