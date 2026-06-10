import { LOG_N, N, N_LOG_N, ONE, type Cost } from "../classes";

/**
 * Known-cost call table (TRD §5.1). Method costs are per call on a size-n receiver;
 * `cbMultiplier` is how many times the callback runs (cost = calls × callback body).
 */
export interface MethodCost {
  cost: Cost;
  cbMultiplier?: Cost;
  note: string;
}

export const METHOD_COSTS: Record<string, MethodCost> = {
  // O(n log n)
  sort: { cost: N_LOG_N, cbMultiplier: N_LOG_N, note: "Array.sort → O(n log n)" },
  toSorted: { cost: N_LOG_N, cbMultiplier: N_LOG_N, note: "Array.toSorted → O(n log n)" },
  // O(n) scans
  includes: { cost: N, note: ".includes → O(n) scan" },
  indexOf: { cost: N, note: ".indexOf → O(n) scan" },
  lastIndexOf: { cost: N, note: ".lastIndexOf → O(n) scan" },
  find: { cost: N, cbMultiplier: N, note: ".find → O(n) scan" },
  findIndex: { cost: N, cbMultiplier: N, note: ".findIndex → O(n) scan" },
  filter: { cost: N, cbMultiplier: N, note: ".filter → O(n)" },
  map: { cost: N, cbMultiplier: N, note: ".map → O(n)" },
  forEach: { cost: N, cbMultiplier: N, note: ".forEach → O(n)" },
  reduce: { cost: N, cbMultiplier: N, note: ".reduce → O(n)" },
  reduceRight: { cost: N, cbMultiplier: N, note: ".reduceRight → O(n)" },
  some: { cost: N, cbMultiplier: N, note: ".some → O(n)" },
  every: { cost: N, cbMultiplier: N, note: ".every → O(n)" },
  flat: { cost: N, note: ".flat → O(n)" },
  flatMap: { cost: N, cbMultiplier: N, note: ".flatMap → O(n)" },
  reverse: { cost: N, note: ".reverse → O(n)" },
  join: { cost: N, note: ".join → O(n)" },
  concat: { cost: N, note: ".concat → O(n)" },
  slice: { cost: N, note: ".slice → O(n) copy" },
  splice: { cost: N, note: ".splice → O(n)" },
  shift: { cost: N, note: ".shift → O(n)" },
  unshift: { cost: N, note: ".unshift → O(n)" },
  split: { cost: N, note: ".split → O(n)" },
  repeat: { cost: N, note: ".repeat → O(n)" },
  fill: { cost: N, note: ".fill → O(n)" },
  // O(1) (amortized where applicable)
  push: { cost: ONE, note: ".push → O(1) amortized" },
  pop: { cost: ONE, note: ".pop → O(1)" },
  get: { cost: ONE, note: "Map/Set.get → O(1) amortized" },
  set: { cost: ONE, note: "Map.set → O(1) amortized" },
  has: { cost: ONE, note: "Map/Set.has → O(1) amortized" },
  add: { cost: ONE, note: "Set.add → O(1) amortized" },
  delete: { cost: ONE, note: "Map/Set.delete → O(1) amortized" },
  charAt: { cost: ONE, note: ".charAt → O(1)" },
  charCodeAt: { cost: ONE, note: ".charCodeAt → O(1)" },
  at: { cost: ONE, note: ".at → O(1)" },
  toFixed: { cost: ONE, note: "O(1)" },
};

/** Free / namespaced calls: `Name(...)` or `Obj.method(...)`. */
export const GLOBAL_COSTS: Record<string, MethodCost> = {
  "Math.*": { cost: ONE, note: "Math.* → O(1)" },
  "Object.keys": { cost: N, note: "Object.keys → O(n)" },
  "Object.values": { cost: N, note: "Object.values → O(n)" },
  "Object.entries": { cost: N, note: "Object.entries → O(n)" },
  "Object.assign": { cost: N, note: "Object.assign → O(n)" },
  "Array.from": { cost: N, note: "Array.from → O(n)" },
  "Array.of": { cost: ONE, note: "Array.of → O(1)" },
  "Array.isArray": { cost: ONE, note: "O(1)" },
  "JSON.parse": { cost: N, note: "JSON.parse → O(n)" },
  "JSON.stringify": { cost: N, note: "JSON.stringify → O(n)" },
  "Number.parseInt": { cost: ONE, note: "O(1)" },
  parseInt: { cost: ONE, note: "O(1)" },
  parseFloat: { cost: ONE, note: "O(1)" },
  String: { cost: ONE, note: "O(1)" },
  Number: { cost: ONE, note: "O(1)" },
  Boolean: { cost: ONE, note: "O(1)" },
  BigInt: { cost: ONE, note: "O(1)" },
  "console.log": { cost: ONE, note: "O(1)" },
  "Number.isInteger": { cost: ONE, note: "O(1)" },
};

export { LOG_N };
