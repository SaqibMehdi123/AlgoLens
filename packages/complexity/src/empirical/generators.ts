/**
 * Input generator presets (PRD C4) + the instrumented array used for op counting.
 * Op counts (index reads/writes through a Proxy) are noise-free and preferred over wall time
 * when the function actually touches the array (TRD §5.2).
 */
export interface OpCounter {
  ops: number;
}

export interface GeneratedInput {
  /** Arguments to apply to the user function. */
  args: unknown[];
  /** Present when the input is instrumented — read after the call. */
  counter?: OpCounter;
}

export type GeneratorKey =
  | "random-array"
  | "sorted-array"
  | "reversed-array"
  | "random-string"
  | "integer-n";

export const GENERATOR_LABELS: Record<GeneratorKey, string> = {
  "random-array": "Random array",
  "sorted-array": "Sorted array",
  "reversed-array": "Reversed array",
  "random-string": "Random string",
  "integer-n": "Integer n",
};

/** Deterministic PRNG so reruns measure the same inputs. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Wrap an array in a Proxy that counts index reads/writes — noise-free operation counting. */
export function instrument(arr: number[], counter: OpCounter): number[] {
  return new Proxy(arr, {
    get(target, prop, receiver) {
      if (typeof prop === "string" && prop !== "length" && !Number.isNaN(Number(prop))) {
        counter.ops++;
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      if (typeof prop === "string" && !Number.isNaN(Number(prop))) counter.ops++;
      return Reflect.set(target, prop, value, receiver);
    },
  });
}

export function generateInput(key: GeneratorKey, n: number, seed = 1): GeneratedInput {
  const rand = mulberry32(seed + n);
  switch (key) {
    case "random-array": {
      const counter: OpCounter = { ops: 0 };
      const arr = Array.from({ length: n }, () => Math.floor(rand() * n));
      return { args: [instrument(arr, counter)], counter };
    }
    case "sorted-array": {
      const counter: OpCounter = { ops: 0 };
      const arr = Array.from({ length: n }, (_, i) => i);
      return { args: [instrument(arr, counter)], counter };
    }
    case "reversed-array": {
      const counter: OpCounter = { ops: 0 };
      const arr = Array.from({ length: n }, (_, i) => n - i);
      return { args: [instrument(arr, counter)], counter };
    }
    case "random-string": {
      const chars = "abcdefghijklmnopqrstuvwxyz";
      let s = "";
      for (let i = 0; i < n; i++) s += chars[Math.floor(rand() * 26)];
      return { args: [s] };
    }
    case "integer-n":
      return { args: [n] };
  }
}
