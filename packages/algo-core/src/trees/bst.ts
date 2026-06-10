import { annotate, highlight, markSorted, setVal, vars } from "../trace/emit";
import type { Step, TreeNodeInit } from "../trace/step";
import type { AlgorithmSpec } from "../types";

interface Node {
  value: number;
  left: Node | null;
  right: Node | null;
}

/** Simulate the inserts to compute the final tree shape (id = stringified value; values distinct). */
function buildTree(values: number[], present: boolean): TreeNodeInit[] {
  const nodes: TreeNodeInit[] = [];
  let root: Node | null = null;
  for (const v of values) {
    const fresh: Node = { value: v, left: null, right: null };
    if (root === null) {
      root = fresh;
      nodes.push({ id: String(v), value: v, parent: null, present });
      continue;
    }
    let cur: Node = root;
    for (;;) {
      if (v < cur.value) {
        if (cur.left === null) {
          cur.left = fresh;
          nodes.push({ id: String(v), value: v, parent: String(cur.value), side: "left", present });
          break;
        }
        cur = cur.left;
      } else {
        if (cur.right === null) {
          cur.right = fresh;
          nodes.push({ id: String(v), value: v, parent: String(cur.value), side: "right", present });
          break;
        }
        cur = cur.right;
      }
    }
  }
  return nodes;
}

// --- BST insert ---------------------------------------------------------------------------------

const insertPseudocode = [
  "for each value v:", // 1
  "  if tree is empty: root ← node(v)", // 2
  "  cur ← root", // 3
  "  if v < cur.value: go left", // 4
  "  else: go right", // 5
  "  attach v as a leaf at the empty spot", // 6
];

export function* bstInsert(values: number[]): Generator<Step> {
  let root: Node | null = null;
  for (const v of values) {
    yield vars({ v }, 1);
    const fresh: Node = { value: v, left: null, right: null };
    if (root === null) {
      root = fresh;
      yield setVal(String(v), v, 2);
      yield highlight([String(v)], 2, "active");
      continue;
    }
    let cur: Node = root;
    for (;;) {
      yield highlight([String(cur.value)], 3, "active");
      if (v < cur.value) {
        yield annotate(`${v} < ${cur.value} → go left`, 4);
        if (cur.left === null) {
          cur.left = fresh;
          yield setVal(String(v), v, 6);
          break;
        }
        cur = cur.left;
      } else {
        yield annotate(`${v} ≥ ${cur.value} → go right`, 5);
        if (cur.right === null) {
          cur.right = fresh;
          yield setVal(String(v), v, 6);
          break;
        }
        cur = cur.right;
      }
    }
    yield highlight([String(v)], 6, "active");
  }
}

export const bstInsertSpec: AlgorithmSpec<number[]> = {
  key: "bst-insert",
  title: "BST — Insert",
  category: "tree",
  layout: "tree",
  pseudocode: insertPseudocode,
  complexity: { best: "O(log n)", average: "O(log n)", worst: "O(n)", space: "O(n)" },
  maxInputSize: 31,
  defaultInput: () => [8, 3, 10, 1, 6, 14, 4, 7, 13],
  buildView: (input) => ({ kind: "tree", nodes: buildTree(input, false) }),
  run: bstInsert,
};

// --- BST search ---------------------------------------------------------------------------------

export interface BstSearchInput {
  values: number[];
  target: number;
}

const searchPseudocode = [
  "cur ← root", // 1
  "while cur ≠ null", // 2
  "  if target = cur.value: return cur", // 3
  "  if target < cur.value: cur ← cur.left", // 4
  "  else: cur ← cur.right", // 5
  "return null  (not found)", // 6
];

export function* bstSearch({ values, target }: BstSearchInput): Generator<Step> {
  // Rebuild the same tree shape the view declares, then walk it.
  const order = new Map<number, Node>();
  let root: Node | null = null;
  for (const v of values) {
    const fresh: Node = { value: v, left: null, right: null };
    order.set(v, fresh);
    if (root === null) {
      root = fresh;
      continue;
    }
    let cur: Node = root;
    for (;;) {
      if (v < cur.value) {
        if (cur.left === null) {
          cur.left = fresh;
          break;
        }
        cur = cur.left;
      } else {
        if (cur.right === null) {
          cur.right = fresh;
          break;
        }
        cur = cur.right;
      }
    }
  }

  yield vars({ target }, 1);
  let cur: Node | null = root;
  while (cur !== null) {
    yield highlight([String(cur.value)], 2, "active");
    yield annotate(`compare target ${target} with ${cur.value}`, 3);
    if (target === cur.value) {
      yield markSorted([String(cur.value)], 3);
      yield annotate(`found ${target}`, 3);
      return;
    }
    if (target < cur.value) {
      yield annotate(`${target} < ${cur.value} → go left`, 4);
      cur = cur.left;
    } else {
      yield annotate(`${target} > ${cur.value} → go right`, 5);
      cur = cur.right;
    }
  }
  yield highlight([], 6, "active");
  yield annotate(`${target} is not in the tree`, 6);
}

export const bstSearchSpec: AlgorithmSpec<BstSearchInput> = {
  key: "bst-search",
  title: "BST — Search",
  category: "tree",
  layout: "tree",
  pseudocode: searchPseudocode,
  complexity: { best: "O(1)", average: "O(log n)", worst: "O(n)", space: "O(1)" },
  maxInputSize: 31,
  defaultInput: () => ({ values: [8, 3, 10, 1, 6, 14, 4, 7, 13], target: 7 }),
  buildView: ({ values }) => ({ kind: "tree", nodes: buildTree(values, true) }),
  run: bstSearch,
};
