import { annotate, cmp, highlight, markSorted, vars } from "../trace/emit";
import type { Step } from "../trace/step";
import type { AlgorithmSpec } from "../types";
import type { SearchInput } from "./linear";

const pseudocode = [
  "lo ← 0; hi ← n−1", // 1
  "while lo ≤ hi", // 2
  "  mid ← ⌊(lo + hi) / 2⌋", // 3
  "  if a[mid] = target: return mid", // 4
  "  if a[mid] < target: lo ← mid + 1", // 5
  "  else: hi ← mid − 1", // 6
  "return −1  (not found)", // 7
];

const range = (lo: number, hi: number): number[] =>
  lo > hi ? [] : Array.from({ length: hi - lo + 1 }, (_, k) => lo + k);

/** Binary search over a sorted array. `lo..hi` window shown as a slate range, `mid` as cyan. */
export function* binarySearch({ array, target }: SearchInput): Generator<Step> {
  let lo = 0;
  let hi = array.length - 1;
  yield vars({ lo, hi, target }, 1);
  while (lo <= hi) {
    yield highlight(range(lo, hi), 2, "range");
    const mid = Math.floor((lo + hi) / 2);
    yield vars({ lo, hi, mid }, 3);
    yield highlight([mid], 3, "active");
    yield cmp(mid, mid, 4); // self-compare = "examine a[mid] against the target"
    if (array[mid] === target) {
      yield markSorted([mid], 4);
      yield annotate(`found ${target} at index ${mid}`, 4);
      return;
    }
    if (array[mid]! < target) {
      yield annotate(`a[${mid}] = ${array[mid]} < ${target} → search right`, 5);
      lo = mid + 1;
    } else {
      yield annotate(`a[${mid}] = ${array[mid]} > ${target} → search left`, 6);
      hi = mid - 1;
    }
  }
  yield highlight([], 7, "range");
  yield highlight([], 7, "active");
  yield annotate(`${target} is not in the array`, 7);
}

export const binarySearchSpec: AlgorithmSpec<SearchInput> = {
  key: "binary-search",
  title: "Binary Search",
  category: "searching",
  layout: "array",
  pseudocode,
  complexity: { best: "O(1)", average: "O(log n)", worst: "O(log n)", space: "O(1)" },
  maxInputSize: 200,
  defaultInput: () => ({ array: [4, 8, 15, 16, 23, 42, 56, 71], target: 23 }),
  buildView: ({ array, target }) => ({ kind: "array", values: array.slice(), needle: target }),
  run: binarySearch,
};
