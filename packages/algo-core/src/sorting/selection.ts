import { cmp, highlight, markSorted, swap, unhighlight, vars } from "../trace/emit";
import type { Step } from "../trace/step";
import type { AlgorithmSpec } from "../types";

const pseudocode = [
  "for i ← 0 to n−2", // 1
  "  min ← i", // 2
  "  for j ← i+1 to n−1", // 3
  "    if a[j] < a[min]", // 4
  "      min ← j", // 5
  "  swap a[i] and a[min]", // 6
  "  mark a[i] as sorted", // 7
];

export function* selectionSort(a: number[]): Generator<Step> {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    yield vars({ i }, 1);
    let min = i;
    yield vars({ min }, 2);
    yield highlight([min], 2, "active");
    for (let j = i + 1; j < n; j++) {
      yield vars({ j }, 3);
      yield cmp(j, min, 4);
      if (a[j]! < a[min]!) {
        yield unhighlight([min], 5);
        min = j;
        yield vars({ min }, 5);
        yield highlight([min], 5, "active");
      }
    }
    yield unhighlight([min], 6);
    if (min !== i) {
      [a[i], a[min]] = [a[min]!, a[i]!];
      yield swap(i, min, 6);
    }
    yield markSorted([i], 7);
  }
  if (n > 0) yield markSorted([n - 1], 7);
}

export const selectionSortSpec: AlgorithmSpec<number[]> = {
  key: "selection-sort",
  title: "Selection Sort",
  category: "sorting",
  layout: "array",
  pseudocode,
  complexity: { best: "O(n²)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
  maxInputSize: 200,
  defaultInput: () => [5, 3, 8, 4, 2, 7, 1, 6],
  buildView: (input) => ({ kind: "array", values: input.slice() }),
  run: selectionSort,
};
