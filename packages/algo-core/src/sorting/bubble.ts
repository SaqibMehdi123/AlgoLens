import { cmp, markSorted, swap, vars } from "../trace/emit";
import type { Step } from "../trace/step";
import type { AlgorithmSpec } from "../types";

const pseudocode = [
  "for i ← 0 to n−2", // 1
  "  for j ← 0 to n−2−i", // 2
  "    if a[j] > a[j+1]", // 3
  "      swap a[j] and a[j+1]", // 4
  "  mark a[n−1−i] as sorted", // 5
];

export function* bubbleSort(a: number[]): Generator<Step> {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    yield vars({ i }, 1);
    for (let j = 0; j < n - 1 - i; j++) {
      yield vars({ j }, 2);
      yield cmp(j, j + 1, 3);
      if (a[j]! > a[j + 1]!) {
        [a[j], a[j + 1]] = [a[j + 1]!, a[j]!];
        yield swap(j, j + 1, 4);
      }
    }
    yield markSorted([n - 1 - i], 5);
  }
  if (n > 0) yield markSorted([0], 5);
}

export const bubbleSortSpec: AlgorithmSpec<number[]> = {
  key: "bubble-sort",
  title: "Bubble Sort",
  category: "sorting",
  layout: "array",
  pseudocode,
  complexity: { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
  maxInputSize: 200,
  defaultInput: () => [5, 3, 8, 4, 2, 7, 1, 6],
  buildView: (input) => ({ kind: "array", values: input.slice() }),
  run: bubbleSort,
};
