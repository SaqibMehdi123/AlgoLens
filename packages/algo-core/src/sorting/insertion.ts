import { cmp, highlight, markSorted, swap, vars } from "../trace/emit";
import type { Step } from "../trace/step";
import type { AlgorithmSpec } from "../types";

const pseudocode = [
  "for i ← 1 to n−1", // 1
  "  j ← i", // 2
  "  while j > 0 and a[j−1] > a[j]", // 3
  "    swap a[j−1] and a[j]", // 4
  "    j ← j − 1", // 5
  "array is sorted", // 6
];

/** Insertion sort, expressed as adjacent swaps so it animates cleanly (same comparison order). */
export function* insertionSort(a: number[]): Generator<Step> {
  const n = a.length;
  for (let i = 1; i < n; i++) {
    yield vars({ i }, 1);
    let j = i;
    yield vars({ j }, 2);
    yield highlight([i], 2, "active");
    while (j > 0) {
      yield cmp(j - 1, j, 3);
      if (a[j - 1]! > a[j]!) {
        [a[j - 1], a[j]] = [a[j]!, a[j - 1]!];
        yield swap(j - 1, j, 4);
        j--;
        yield vars({ j }, 5);
      } else {
        break;
      }
    }
  }
  yield markSorted(
    Array.from({ length: n }, (_, k) => k),
    6,
  );
}

export const insertionSortSpec: AlgorithmSpec<number[]> = {
  key: "insertion-sort",
  title: "Insertion Sort",
  category: "sorting",
  layout: "array",
  pseudocode,
  complexity: { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
  maxInputSize: 200,
  defaultInput: () => [5, 3, 8, 4, 2, 7, 1, 6],
  buildView: (input) => ({ kind: "array", values: input.slice() }),
  run: insertionSort,
};
