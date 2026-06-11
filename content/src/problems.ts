/**
 * Practice problems (PRD D2) — content-in-repo, mirroring docs/03 §5 shapes. Conventions:
 *  - The submission receives the raw input as the global string `input` and prints with
 *    `console.log` — same harness semantics client-side (exec-worker) and server-side (judge).
 *  - `isSample: true` cases are public (shown in the workspace, run client-side).
 *    Hidden cases NEVER leave the server in any response shape (rule 6 — tested).
 *  - `expected` values are verified against the reference solutions by the judge test suite;
 *    a mismatch fails CI, so expecteds cannot drift from the solutions that generate them.
 */
export type ProblemDifficulty = "intro" | "easy" | "medium" | "hard";

export interface TestCaseDef {
  input: string;
  expected: string;
  isSample: boolean;
  weight?: number;
}

export interface ProblemDef {
  slug: string;
  title: string;
  difficulty: ProblemDifficulty;
  tags: string[];
  /** Markdown statement (rendered server-side; no embedded components). */
  statementMd: string;
  starterCode: string;
  /** Reference solution — generates/verifies expected outputs via the judge. */
  referenceSolution: string;
  timeLimitMs: number;
  /** Lesson this problem practices (lessons link back via practiceSlug). */
  lessonSlug: string | null;
  cases: TestCaseDef[];
}

const STARTER = `// \`input\` is the problem input as a string.
// Parse it, compute the answer, print it with console.log.
const lines = input.trim().split("\\n");
`;

export const problems: ProblemDef[] = [
  {
    slug: "sum-of-array",
    title: "Sum of Array",
    difficulty: "intro",
    tags: ["arrays", "loops"],
    lessonSlug: "big-o-notation",
    timeLimitMs: 2000,
    statementMd: `Given a list of integers, print their sum.

**Input** — one line: space-separated integers.

**Output** — a single integer: the sum.

This is the canonical O(n) single pass: touch every element exactly once.`,
    starterCode: STARTER,
    referenceSolution: `const nums = input.trim().split(/\\s+/).map(Number);
let s = 0;
for (let i = 0; i < nums.length; i++) s += nums[i];
console.log(s);`,
    cases: [
      { input: "1 2 3 4 5", expected: "15", isSample: true },
      { input: "10 -3 7", expected: "14", isSample: true },
      { input: "42", expected: "42", isSample: false },
      { input: "-1 -2 -3 -4", expected: "-10", isSample: false },
      { input: "1000000 1000000 1000000", expected: "3000000", isSample: false },
    ],
  },
  {
    slug: "max-of-array",
    title: "Maximum Element",
    difficulty: "intro",
    tags: ["arrays", "loops"],
    lessonSlug: "big-o-notation",
    timeLimitMs: 2000,
    statementMd: `Print the largest integer in the list.

**Input** — one line: space-separated integers (at least one).

**Output** — the maximum value.`,
    starterCode: STARTER,
    referenceSolution: `const nums = input.trim().split(/\\s+/).map(Number);
let m = nums[0];
for (const v of nums) if (v > m) m = v;
console.log(m);`,
    cases: [
      { input: "3 1 4 1 5", expected: "5", isSample: true },
      { input: "-7 -3 -9", expected: "-3", isSample: true },
      { input: "8", expected: "8", isSample: false },
      { input: "2 2 2 2", expected: "2", isSample: false },
      { input: "0 -1 999999 5", expected: "999999", isSample: false },
    ],
  },
  {
    slug: "reverse-string",
    title: "Reverse a String",
    difficulty: "intro",
    tags: ["strings"],
    lessonSlug: null,
    timeLimitMs: 2000,
    statementMd: `Print the input string reversed.

**Input** — one line: a string without spaces.

**Output** — the reversed string.`,
    starterCode: STARTER,
    referenceSolution: `const s = input.trim();
let out = "";
for (let i = s.length - 1; i >= 0; i--) out += s[i];
console.log(out);`,
    cases: [
      { input: "hello", expected: "olleh", isSample: true },
      { input: "ab", expected: "ba", isSample: true },
      { input: "x", expected: "x", isSample: false },
      { input: "racecar", expected: "racecar", isSample: false },
      { input: "AlgoLens", expected: "sneLoglA", isSample: false },
    ],
  },
  {
    slug: "count-vowels",
    title: "Count Vowels",
    difficulty: "intro",
    tags: ["strings", "loops"],
    lessonSlug: null,
    timeLimitMs: 2000,
    statementMd: `Count the vowels (a, e, i, o, u — lowercase) in the input string.

**Input** — one line: a lowercase string.

**Output** — the number of vowels.`,
    starterCode: STARTER,
    referenceSolution: `const s = input.trim();
let c = 0;
for (const ch of s) if ("aeiou".includes(ch)) c++;
console.log(c);`,
    cases: [
      { input: "algorithm", expected: "3", isSample: true },
      { input: "xyz", expected: "0", isSample: true },
      { input: "aeiou", expected: "5", isSample: false },
      { input: "complexity", expected: "3", isSample: false },
      { input: "queueing", expected: "5", isSample: false },
    ],
  },
  {
    slug: "fizzbuzz-range",
    title: "FizzBuzz Range",
    difficulty: "intro",
    tags: ["loops", "conditionals"],
    lessonSlug: "big-o-notation",
    timeLimitMs: 2000,
    statementMd: `For each integer from 1 to n, print \`Fizz\` if divisible by 3, \`Buzz\` if divisible
by 5, \`FizzBuzz\` if divisible by both, otherwise the number itself — one per line.

**Input** — one line: the integer n (1 ≤ n ≤ 1000).

**Output** — n lines.`,
    starterCode: STARTER,
    referenceSolution: `const n = Number(input.trim());
for (let i = 1; i <= n; i++) {
  if (i % 15 === 0) console.log("FizzBuzz");
  else if (i % 3 === 0) console.log("Fizz");
  else if (i % 5 === 0) console.log("Buzz");
  else console.log(i);
}`,
    cases: [
      { input: "5", expected: "1\n2\nFizz\n4\nBuzz", isSample: true },
      { input: "3", expected: "1\n2\nFizz", isSample: true },
      { input: "1", expected: "1", isSample: false },
      { input: "15", expected: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", isSample: false },
    ],
  },
  {
    slug: "find-index",
    title: "Find the Target (Linear Search)",
    difficulty: "easy",
    tags: ["arrays", "searching"],
    lessonSlug: "big-o-notation",
    timeLimitMs: 2000,
    statementMd: `Print the index of the first occurrence of the target, or \`-1\` if absent.

**Input** — line 1: space-separated integers. Line 2: the target.

**Output** — the 0-based index, or -1.`,
    starterCode: STARTER,
    referenceSolution: `const [arrLine, tLine] = input.trim().split("\\n");
const nums = arrLine.trim().split(/\\s+/).map(Number);
const target = Number(tLine);
let idx = -1;
for (let i = 0; i < nums.length; i++) { if (nums[i] === target) { idx = i; break; } }
console.log(idx);`,
    cases: [
      { input: "4 8 15 16 23 42\n16", expected: "3", isSample: true },
      { input: "1 2 3\n9", expected: "-1", isSample: true },
      { input: "7 7 7\n7", expected: "0", isSample: false },
      { input: "5\n5", expected: "0", isSample: false },
      { input: "-3 0 12\n12", expected: "2", isSample: false },
    ],
  },
  {
    slug: "binary-search-position",
    title: "Binary Search Position",
    difficulty: "easy",
    tags: ["searching", "binary-search"],
    lessonSlug: "binary-search",
    timeLimitMs: 2000,
    statementMd: `The array is **sorted ascending** with distinct values. Print the index of the
target, or \`-1\` if absent — in O(log n), the way the [Binary Search lesson](/learn/dsa-foundations/binary-search) does it.

**Input** — line 1: sorted space-separated integers. Line 2: the target.

**Output** — the 0-based index, or -1.`,
    starterCode: STARTER,
    referenceSolution: `const [arrLine, tLine] = input.trim().split("\\n");
const a = arrLine.trim().split(/\\s+/).map(Number);
const t = Number(tLine);
let lo = 0, hi = a.length - 1, ans = -1;
while (lo <= hi) {
  const mid = Math.floor((lo + hi) / 2);
  if (a[mid] === t) { ans = mid; break; }
  if (a[mid] < t) lo = mid + 1; else hi = mid - 1;
}
console.log(ans);`,
    cases: [
      { input: "4 8 15 16 23 42 56 71\n23", expected: "4", isSample: true },
      { input: "1 3 5 7\n4", expected: "-1", isSample: true },
      { input: "10\n10", expected: "0", isSample: false },
      { input: "1 2 3 4 5 6 7 8 9\n9", expected: "8", isSample: false },
      { input: "1 2 3 4 5 6 7 8 9\n1", expected: "0", isSample: false },
      { input: "-50 -10 0 30\n-10", expected: "1", isSample: false },
    ],
  },
  {
    slug: "first-duplicate",
    title: "First Duplicate",
    difficulty: "easy",
    tags: ["arrays", "hashing"],
    lessonSlug: null,
    timeLimitMs: 2000,
    statementMd: `Print the first value that appears a second time while scanning left to right,
or \`-1\` if all values are distinct. A Set makes this a single O(n) pass.

**Input** — one line: space-separated integers.

**Output** — the first repeated value, or -1.`,
    starterCode: STARTER,
    referenceSolution: `const nums = input.trim().split(/\\s+/).map(Number);
const seen = new Set();
let ans = -1;
for (const v of nums) { if (seen.has(v)) { ans = v; break; } seen.add(v); }
console.log(ans);`,
    cases: [
      { input: "2 1 3 5 3 2", expected: "3", isSample: true },
      { input: "1 2 3 4", expected: "-1", isSample: true },
      { input: "9 9", expected: "9", isSample: false },
      { input: "5 4 5 4", expected: "5", isSample: false },
      { input: "1", expected: "-1", isSample: false },
    ],
  },
  {
    slug: "two-sum-indices",
    title: "Two Sum (Indices)",
    difficulty: "easy",
    tags: ["arrays", "hashing"],
    lessonSlug: "big-o-notation",
    timeLimitMs: 2000,
    statementMd: `Print the indices \`i j\` (i < j) of the two numbers that add to the target.
Exactly one solution exists. The nested-loop version is O(n²) — after you get Accepted, paste
your code into the [Complexity Lab](/analyze) and see; a Map gets it to O(n).

**Input** — line 1: space-separated integers. Line 2: the target.

**Output** — two indices separated by a space.`,
    starterCode: STARTER,
    referenceSolution: `const [arrLine, tLine] = input.trim().split("\\n");
const nums = arrLine.trim().split(/\\s+/).map(Number);
const target = Number(tLine);
const seen = new Map();
for (let j = 0; j < nums.length; j++) {
  const need = target - nums[j];
  if (seen.has(need)) { console.log(seen.get(need) + " " + j); break; }
  seen.set(nums[j], j);
}`,
    cases: [
      { input: "2 7 11 15\n9", expected: "0 1", isSample: true },
      { input: "3 2 4\n6", expected: "1 2", isSample: true },
      { input: "3 3\n6", expected: "0 1", isSample: false },
      { input: "5 -2 9 1\n-1", expected: "1 3", isSample: false },
      { input: "1 2 3 4 5 6\n11", expected: "4 5", isSample: false },
    ],
  },
  {
    slug: "is-palindrome",
    title: "Palindrome Check",
    difficulty: "easy",
    tags: ["strings", "two-pointers"],
    lessonSlug: null,
    timeLimitMs: 2000,
    statementMd: `Print \`true\` if the string reads the same forwards and backwards, else \`false\`.
Two pointers from the ends meet in the middle — O(n) time, O(1) space.

**Input** — one line: a lowercase string.

**Output** — \`true\` or \`false\`.`,
    starterCode: STARTER,
    referenceSolution: `const s = input.trim();
let l = 0, r = s.length - 1, ok = true;
while (l < r) { if (s[l] !== s[r]) { ok = false; break; } l++; r--; }
console.log(ok);`,
    cases: [
      { input: "racecar", expected: "true", isSample: true },
      { input: "hello", expected: "false", isSample: true },
      { input: "a", expected: "true", isSample: false },
      { input: "abba", expected: "true", isSample: false },
      { input: "abca", expected: "false", isSample: false },
    ],
  },
  {
    slug: "second-largest",
    title: "Second Largest",
    difficulty: "easy",
    tags: ["arrays"],
    lessonSlug: null,
    timeLimitMs: 2000,
    statementMd: `Print the second-largest **distinct** value. At least two distinct values exist.
One pass, two trackers — no sort needed.

**Input** — one line: space-separated integers.

**Output** — the second-largest distinct value.`,
    starterCode: STARTER,
    referenceSolution: `const nums = input.trim().split(/\\s+/).map(Number);
let first = -Infinity, second = -Infinity;
for (const v of nums) {
  if (v > first) { second = first; first = v; }
  else if (v < first && v > second) { second = v; }
}
console.log(second);`,
    cases: [
      { input: "3 9 5 9 1", expected: "5", isSample: true },
      { input: "1 2", expected: "1", isSample: true },
      { input: "10 10 9", expected: "9", isSample: false },
      { input: "-5 -2 -9", expected: "-5", isSample: false },
      { input: "100 50 100 99", expected: "99", isSample: false },
    ],
  },
  {
    slug: "merge-two-sorted",
    title: "Merge Two Sorted Lists",
    difficulty: "easy",
    tags: ["arrays", "sorting", "two-pointers"],
    lessonSlug: "binary-search",
    timeLimitMs: 2000,
    statementMd: `Merge two sorted lists into one sorted line — the merge step of merge sort,
in O(n + m) with two pointers (no sorting allowed conceptually!).

**Input** — line 1: first sorted list. Line 2: second sorted list (either may be empty).

**Output** — all values merged, space-separated.`,
    starterCode: STARTER,
    referenceSolution: `const ls = input.split("\\n");
const a = (ls[0] ?? "").trim() === "" ? [] : ls[0].trim().split(/\\s+/).map(Number);
const b = (ls[1] ?? "").trim() === "" ? [] : ls[1].trim().split(/\\s+/).map(Number);
const out = [];
let i = 0, j = 0;
while (i < a.length && j < b.length) out.push(a[i] <= b[j] ? a[i++] : b[j++]);
while (i < a.length) out.push(a[i++]);
while (j < b.length) out.push(b[j++]);
console.log(out.join(" "));`,
    cases: [
      { input: "1 3 5\n2 4 6", expected: "1 2 3 4 5 6", isSample: true },
      { input: "1 2\n3 4", expected: "1 2 3 4", isSample: true },
      { input: "5\n1 9", expected: "1 5 9", isSample: false },
      { input: "2 2\n2", expected: "2 2 2", isSample: false },
      { input: "-3 0 3\n-2 2", expected: "-3 -2 0 2 3", isSample: false },
    ],
  },
  {
    slug: "missing-number",
    title: "Missing Number",
    difficulty: "easy",
    tags: ["arrays", "math"],
    lessonSlug: "binary-search",
    timeLimitMs: 2000,
    statementMd: `The list contains every integer from 0 to n exactly once — except one. Print the
missing one. The sum formula n(n+1)/2 solves it in O(n) time and O(1) space.

**Input** — one line: n space-separated integers (the range is 0..n).

**Output** — the missing integer.`,
    starterCode: STARTER,
    referenceSolution: `const nums = input.trim().split(/\\s+/).map(Number);
const n = nums.length;
let sum = 0;
for (const v of nums) sum += v;
console.log((n * (n + 1)) / 2 - sum);`,
    cases: [
      { input: "3 0 1", expected: "2", isSample: true },
      { input: "0 1", expected: "2", isSample: true },
      { input: "1", expected: "0", isSample: false },
      { input: "9 6 4 2 3 5 7 0 1", expected: "8", isSample: false },
      { input: "0", expected: "1", isSample: false },
    ],
  },
  {
    slug: "count-pairs-with-sum",
    title: "Count Pairs With Sum",
    difficulty: "medium",
    tags: ["arrays", "hashing"],
    lessonSlug: "big-o-notation",
    timeLimitMs: 2000,
    statementMd: `Count the pairs (i, j) with i < j whose values add to the target. The obvious
solution is the O(n²) double loop from the [Big-O lesson](/learn/dsa-foundations/big-o-notation);
a frequency map does it in O(n). Both pass here — measure them in the Lab afterwards.

**Input** — line 1: space-separated integers. Line 2: the target.

**Output** — the number of pairs.`,
    starterCode: STARTER,
    referenceSolution: `const [arrLine, tLine] = input.trim().split("\\n");
const nums = arrLine.trim().split(/\\s+/).map(Number);
const target = Number(tLine);
let c = 0;
for (let i = 0; i < nums.length; i++) {
  for (let j = i + 1; j < nums.length; j++) {
    if (nums[i] + nums[j] === target) c++;
  }
}
console.log(c);`,
    cases: [
      { input: "1 5 7 -1 5\n6", expected: "3", isSample: true },
      { input: "1 1 1 1\n2", expected: "6", isSample: true },
      { input: "2 4\n7", expected: "0", isSample: false },
      { input: "0 0 0\n0", expected: "3", isSample: false },
      { input: "3 -3 4 -4 7\n0", expected: "2", isSample: false },
    ],
  },
  {
    slug: "rotate-array-left",
    title: "Rotate Array Left",
    difficulty: "easy",
    tags: ["arrays"],
    lessonSlug: null,
    timeLimitMs: 2000,
    statementMd: `Rotate the list left by k positions and print it. k may exceed the length —
take it modulo n. Slicing does it in O(n) without element-by-element shifting.

**Input** — line 1: space-separated integers. Line 2: k (k ≥ 0).

**Output** — the rotated list, space-separated.`,
    starterCode: STARTER,
    referenceSolution: `const [arrLine, kLine] = input.trim().split("\\n");
const nums = arrLine.trim().split(/\\s+/).map(Number);
const k = Number(kLine) % nums.length;
const out = nums.slice(k).concat(nums.slice(0, k));
console.log(out.join(" "));`,
    cases: [
      { input: "1 2 3 4 5\n2", expected: "3 4 5 1 2", isSample: true },
      { input: "1 2 3\n0", expected: "1 2 3", isSample: true },
      { input: "1 2 3\n3", expected: "1 2 3", isSample: false },
      { input: "1 2 3 4\n6", expected: "3 4 1 2", isSample: false },
      { input: "7\n10", expected: "7", isSample: false },
    ],
  },
];

export function getProblem(slug: string): ProblemDef | undefined {
  return problems.find((p) => p.slug === slug);
}
