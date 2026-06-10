/**
 * The 50-function golden benchmark (TRD §5.4 / roadmap Phase 3): textbook patterns with known
 * classes. CI fails below 90% accuracy. Failures print a diff table so regressions are obvious.
 */
import { describe, expect, it } from "vitest";
import { analyzeStatic } from "../src";

interface Case {
  name: string;
  expected: string;
  code: string;
}

const CASES: Case[] = [
  // ---------- O(1) ----------
  { name: "array first", expected: "O(1)", code: `function first(a) { return a[0]; }` },
  { name: "arithmetic", expected: "O(1)", code: `function add(a, b) { return a + b; }` },
  {
    name: "swap two elements",
    expected: "O(1)",
    code: `function swapEnds(a) { const t = a[0]; a[0] = a[1]; a[1] = t; return a; }`,
  },
  {
    name: "constant-bound loop",
    expected: "O(1)",
    code: `function tenSum() { let s = 0; for (let i = 0; i < 10; i++) { s += i; } return s; }`,
  },
  { name: "map lookup", expected: "O(1)", code: `function lookup(m, k) { return m.get(k); }` },

  // ---------- O(log n) ----------
  {
    name: "binary search (iterative)",
    expected: "O(log n)",
    code: `function bsearch(a, t) {
      let lo = 0, hi = a.length - 1;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (a[mid] === t) return mid;
        if (a[mid] < t) lo = mid + 1; else hi = mid - 1;
      }
      return -1;
    }`,
  },
  {
    name: "halving while-loop",
    expected: "O(log n)",
    code: `function halvings(n) { let c = 0; while (n > 1) { n = Math.floor(n / 2); c++; } return c; }`,
  },
  {
    name: "doubling for-loop",
    expected: "O(log n)",
    code: `function doublings(n) { let c = 0; for (let i = 1; i < n; i *= 2) { c++; } return c; }`,
  },
  {
    name: "binary search (recursive)",
    expected: "O(log n)",
    code: `function bsr(a, t, lo, hi) {
      if (lo > hi) return -1;
      const mid = Math.floor((lo + hi) / 2);
      if (a[mid] === t) return mid;
      if (a[mid] < t) return bsr(a, t, mid + 1, hi);
      return bsr(a, t, lo, mid - 1);
    }`,
  },
  {
    name: "bit count via shifts",
    expected: "O(log n)",
    code: `function bits(x) { let c = 0; while (x > 0) { c += x & 1; x >>= 1; } return c; }`,
  },
  {
    name: "recursive halving",
    expected: "O(log n)",
    code: `function depth(n) { if (n <= 1) return 0; return depth(Math.floor(n / 2)) + 1; }`,
  },

  // ---------- O(n) ----------
  {
    name: "sum loop",
    expected: "O(n)",
    code: `function sum(a) { let s = 0; for (let i = 0; i < a.length; i++) { s += a[i]; } return s; }`,
  },
  {
    name: "linear search",
    expected: "O(n)",
    code: `function find(a, x) { for (let i = 0; i < a.length; i++) { if (a[i] === x) return i; } return -1; }`,
  },
  { name: "includes call", expected: "O(n)", code: `function has(a, x) { return a.includes(x); }` },
  {
    name: "for-of sum",
    expected: "O(n)",
    code: `function total(a) { let s = 0; for (const v of a) { s += v; } return s; }`,
  },
  {
    name: "filter count",
    expected: "O(n)",
    code: `function positives(a) { return a.filter(x => x > 0).length; }`,
  },
  {
    name: "reverse copy",
    expected: "O(n)",
    code: `function rev(a) { const out = []; for (let i = a.length - 1; i >= 0; i--) { out.push(a[i]); } return out; }`,
  },
  {
    name: "two-pointer palindrome",
    expected: "O(n)",
    code: `function pal(s) {
      let l = 0; const r0 = s.length - 1; let r = r0;
      while (l < r) { if (s[l] !== s[r]) return false; l++; r--; }
      return true;
    }`,
  },
  {
    name: "linear recursion (index)",
    expected: "O(n)",
    code: `function sumFrom(a, i) { if (i >= a.length) return 0; return a[i] + sumFrom(a, i + 1); }`,
  },
  {
    name: "factorial",
    expected: "O(n)",
    code: `function fact(n) { if (n <= 1) return 1; return n * fact(n - 1); }`,
  },
  {
    name: "spread into Math.max",
    expected: "O(n)",
    code: `function mx(a) { return Math.max(...a); }`,
  },
  {
    name: "dedupe via Set",
    expected: "O(n)",
    code: `function uniqueCount(a) { return new Set(a).size; }`,
  },
  {
    name: "running average",
    expected: "O(n)",
    code: `function avg(a) { let s = 0; let i = 0; while (i < a.length) { s += a[i]; i += 1; } return s / a.length; }`,
  },

  // ---------- O(n log n) ----------
  {
    name: "sort call",
    expected: "O(n log n)",
    code: `function sorted(a) { return a.sort((x, y) => x - y); }`,
  },
  {
    name: "merge sort",
    expected: "O(n log n)",
    code: `function merge(l, r) {
      const out = [];
      let i = 0, j = 0;
      while (i < l.length && j < r.length) { out.push(l[i] <= r[j] ? l[i++] : r[j++]); }
      while (i < l.length) out.push(l[i++]);
      while (j < r.length) out.push(r[j++]);
      return out;
    }
    function mergeSort(arr) {
      if (arr.length <= 1) return arr;
      const mid = Math.floor(arr.length / 2);
      const left = mergeSort(arr.slice(0, mid));
      const right = mergeSort(arr.slice(mid));
      return merge(left, right);
    }`,
  },
  {
    name: "sort then scan",
    expected: "O(n log n)",
    code: `function medianish(a) {
      a.sort((x, y) => x - y);
      let s = 0;
      for (let i = 0; i < a.length; i++) { s += a[i]; }
      return a[Math.floor(a.length / 2)] + s;
    }`,
  },
  {
    name: "toSorted + join",
    expected: "O(n log n)",
    code: `function signature(a) { return a.toSorted().join(","); }`,
  },
  {
    name: "sort with comparator",
    expected: "O(n log n)",
    code: `function byLength(words) { return words.sort((x, y) => x.length - y.length); }`,
  },
  {
    name: "divide & conquer max",
    expected: "O(n log n)",
    code: `function dcMax(a) {
      if (a.length <= 1) return a[0];
      const mid = Math.floor(a.length / 2);
      return Math.max(dcMax(a.slice(0, mid)), dcMax(a.slice(mid)));
    }`,
  },
  {
    name: "loop with inner halving",
    expected: "O(n log n)",
    code: `function heapish(a) {
      let work = 0;
      for (let i = 0; i < a.length; i++) {
        let k = i + 1;
        while (k > 1) { k = Math.floor(k / 2); work++; }
      }
      return work;
    }`,
  },

  // ---------- O(n²) ----------
  {
    name: "twoSum (nested)",
    expected: "O(n²)",
    code: `function twoSum(nums, target) {
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          if (nums[i] + nums[j] === target) return [i, j];
        }
      }
      return [];
    }`,
  },
  {
    name: "bubble sort",
    expected: "O(n²)",
    code: `function bubble(a) {
      for (let i = 0; i < a.length - 1; i++) {
        for (let j = 0; j < a.length - 1 - i; j++) {
          if (a[j] > a[j + 1]) { const t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; }
        }
      }
      return a;
    }`,
  },
  {
    name: "selection sort",
    expected: "O(n²)",
    code: `function selection(a) {
      for (let i = 0; i < a.length; i++) {
        let min = i;
        for (let j = i + 1; j < a.length; j++) { if (a[j] < a[min]) min = j; }
        const t = a[i]; a[i] = a[min]; a[min] = t;
      }
      return a;
    }`,
  },
  {
    name: "insertion sort",
    expected: "O(n²)",
    code: `function insertion(a) {
      for (let i = 1; i < a.length; i++) {
        let j = i;
        while (j > 0 && a[j - 1] > a[j]) { const t = a[j]; a[j] = a[j - 1]; a[j - 1] = t; j--; }
      }
      return a;
    }`,
  },
  {
    name: "all pairs",
    expected: "O(n²)",
    code: `function pairs(a) {
      const out = [];
      for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < a.length; j++) { out.push([a[i], a[j]]); }
      }
      return out;
    }`,
  },
  {
    name: "triangular nested loop",
    expected: "O(n²)",
    code: `function tri(n) { let c = 0; for (let i = 0; i < n; i++) { for (let j = 0; j < i; j++) { c++; } } return c; }`,
  },
  {
    name: "matrix row sums",
    expected: "O(n²)",
    code: `function rowSums(m) {
      const out = [];
      for (let i = 0; i < m.length; i++) {
        let s = 0;
        for (let j = 0; j < m[i].length; j++) { s += m[i][j]; }
        out.push(s);
      }
      return out;
    }`,
  },
  {
    name: "scan with includes inside",
    expected: "O(n²)",
    code: `function hasSuccessor(a) {
      let c = 0;
      for (let i = 0; i < a.length; i++) { if (a.includes(a[i] + 1)) c++; }
      return c;
    }`,
  },
  {
    name: "count zero-sum pairs",
    expected: "O(n²)",
    code: `function zeroPairs(a) {
      let c = 0;
      for (let i = 0; i < a.length; i++) {
        for (let j = i + 1; j < a.length; j++) { if (a[i] + a[j] === 0) c++; }
      }
      return c;
    }`,
  },
  {
    name: "naive substring search",
    expected: "O(n²)",
    code: `function indexOfNaive(s, p) {
      for (let i = 0; i < s.length; i++) {
        let ok = true;
        for (let j = 0; j < p.length; j++) { if (s[i + j] !== p[j]) { ok = false; break; } }
        if (ok) return i;
      }
      return -1;
    }`,
  },
  {
    name: "insert into sorted via splice",
    expected: "O(n²)",
    code: `function insertAll(a) {
      const out = [];
      for (let i = 0; i < a.length; i++) { out.splice(0, 0, a[i]); }
      return out;
    }`,
  },
  {
    name: "nested forEach",
    expected: "O(n²)",
    code: `function gridVisit(a) {
      let c = 0;
      a.forEach(x => a.forEach(y => { c += x + y; }));
      return c;
    }`,
  },

  // ---------- O(n³) ----------
  {
    name: "triple nested loop",
    expected: "O(n³)",
    code: `function triple(n) {
      let c = 0;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) c++;
      return c;
    }`,
  },
  {
    name: "matrix multiply",
    expected: "O(n³)",
    code: `function matmul(a, b) {
      const out = [];
      for (let i = 0; i < a.length; i++) {
        out.push([]);
        for (let j = 0; j < b.length; j++) {
          let s = 0;
          for (let k = 0; k < a.length; k++) { s += a[i][k] * b[k][j]; }
          out[i].push(s);
        }
      }
      return out;
    }`,
  },
  {
    name: "all triplets",
    expected: "O(n³)",
    code: `function triplets(a) {
      let c = 0;
      for (let i = 0; i < a.length; i++)
        for (let j = i + 1; j < a.length; j++)
          for (let k = j + 1; k < a.length; k++)
            if (a[i] + a[j] + a[k] === 0) c++;
      return c;
    }`,
  },

  // ---------- O(2ⁿ) ----------
  {
    name: "naive fibonacci",
    expected: "O(2ⁿ)",
    code: `function fib(n) { if (n <= 1) return n; return fib(n - 1) + fib(n - 2); }`,
  },
  {
    name: "towers of hanoi",
    expected: "O(2ⁿ)",
    code: `function hanoi(n) { if (n === 0) return 0; return hanoi(n - 1) + 1 + hanoi(n - 1); }`,
  },
  {
    name: "fib-shaped count",
    expected: "O(2ⁿ)",
    code: `function count(n) { if (n <= 0) return 1; return count(n - 1) + count(n - 2); }`,
  },
  {
    name: "tribonacci",
    expected: "O(2ⁿ)",
    code: `function trib(n) { if (n <= 2) return 1; return trib(n - 1) + trib(n - 2) + trib(n - 3); }`,
  },
  {
    name: "power set (index recursion)",
    expected: "O(2ⁿ)",
    code: `function ps(a, i) { if (i >= a.length) return 1; return ps(a, i + 1) + ps(a, i + 1); }`,
  },
];

describe("50-function golden benchmark", () => {
  it("has exactly 50 cases", () => {
    expect(CASES.length).toBe(50);
  });

  it("classifies ≥ 90% correctly (CI gate)", () => {
    const failures: string[] = [];
    for (const c of CASES) {
      const r = analyzeStatic(c.code);
      const got = r.ok ? r.bigO : `parse error: ${r.error}`;
      if (got !== c.expected) failures.push(`${c.name}: expected ${c.expected}, got ${got}`);
    }
    const accuracy = (CASES.length - failures.length) / CASES.length;
    expect(
      accuracy,
      `accuracy ${(accuracy * 100).toFixed(0)}% — failures:\n  ${failures.join("\n  ")}`,
    ).toBeGreaterThanOrEqual(0.9);
  });

  it("twoSum-nested → O(n²) with HIGH confidence (Phase 3 acceptance)", () => {
    const twoSum = CASES.find((c) => c.name === "twoSum (nested)")!;
    const r = analyzeStatic(twoSum.code);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.bigO).toBe("O(n²)");
      expect(r.confidence).toBe("high");
      expect(r.annotations.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("naive fib → exponential with a recurrence annotation", () => {
    const fib = CASES.find((c) => c.name === "naive fibonacci")!;
    const r = analyzeStatic(fib.code);
    expect(r.ok && r.bigO).toBe("O(2ⁿ)");
    if (r.ok) expect(r.annotations.some((a) => a.note.includes("exponential"))).toBe(true);
  });
});
