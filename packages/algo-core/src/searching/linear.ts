import { annotate, highlight, markSorted, vars } from "../trace/emit";
import type { Step } from "../trace/step";
import type { AlgorithmSpec } from "../types";

export interface SearchInput {
  array: number[];
  target: number;
}

const pseudocode = [
  "for i ← 0 to n−1", // 1
  "  if a[i] = target: return i", // 2
  "return −1  (not found)", // 3
];

export function* linearSearch({ array, target }: SearchInput): Generator<Step> {
  yield vars({ target }, 1);
  for (let i = 0; i < array.length; i++) {
    yield highlight([i], 1, "active");
    yield annotate(`a[${i}] = ${array[i]} vs target ${target}`, 2);
    if (array[i] === target) {
      yield markSorted([i], 2);
      yield annotate(`found ${target} at index ${i}`, 2);
      return;
    }
  }
  yield highlight([], 3, "active");
  yield annotate(`${target} is not in the array`, 3);
}

export const linearSearchSpec: AlgorithmSpec<SearchInput> = {
  key: "linear-search",
  title: "Linear Search",
  category: "searching",
  layout: "array",
  pseudocode,
  complexity: { best: "O(1)", average: "O(n)", worst: "O(n)", space: "O(1)" },
  maxInputSize: 200,
  defaultInput: () => ({ array: [4, 8, 15, 16, 23, 42, 56, 71], target: 23 }),
  buildView: ({ array, target }) => ({ kind: "array", values: array.slice(), needle: target }),
  run: linearSearch,
};
