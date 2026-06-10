/**
 * Complexity-class algebra. A cost is (polynomial degree, log power, exponential flag);
 * the TRD §5.1 combination rules become arithmetic: nested ⇒ multiply, sequential ⇒ max.
 * The static layer can emit any class this algebra produces (e.g. O(n² log n)); the empirical
 * layer fits only the seven candidate classes from TRD §5.2.
 */
export interface Cost {
  /** Polynomial degree of n. */
  deg: number;
  /** Power of log n. */
  log: number;
  /** Exponential (2ⁿ) — absorbs everything else. */
  exp: boolean;
}

export const ONE: Cost = { deg: 0, log: 0, exp: false };
export const LOG_N: Cost = { deg: 0, log: 1, exp: false };
export const N: Cost = { deg: 1, log: 0, exp: false };
export const N_LOG_N: Cost = { deg: 1, log: 1, exp: false };
export const N2: Cost = { deg: 2, log: 0, exp: false };
export const N3: Cost = { deg: 3, log: 0, exp: false };
export const EXP: Cost = { deg: 0, log: 0, exp: true };

/** Nested constructs multiply. */
export function mul(a: Cost, b: Cost): Cost {
  if (a.exp || b.exp) return EXP;
  return { deg: a.deg + b.deg, log: a.log + b.log, exp: false };
}

/** Sequential constructs take the dominant term. */
export function max(a: Cost, b: Cost): Cost {
  return compare(a, b) >= 0 ? a : b;
}

/** Total order: exponential > higher degree > higher log power. */
export function compare(a: Cost, b: Cost): number {
  if (a.exp !== b.exp) return a.exp ? 1 : -1;
  if (a.deg !== b.deg) return a.deg - b.deg;
  return a.log - b.log;
}

export function equals(a: Cost, b: Cost): boolean {
  return compare(a, b) === 0;
}

const SUP: Record<number, string> = { 2: "²", 3: "³", 4: "⁴", 5: "⁵" };

/** Canonical label, e.g. "O(n log n)", "O(n²)", "O(2ⁿ)", "O(log² n)". */
export function toLabel(c: Cost): string {
  if (c.exp) return "O(2ⁿ)";
  const logPart = c.log === 0 ? "" : c.log === 1 ? "log n" : `log${SUP[c.log] ?? `^${c.log}`} n`;
  if (c.deg === 0) return logPart === "" ? "O(1)" : `O(${logPart})`;
  const nPart = c.deg === 1 ? "n" : `n${SUP[c.deg] ?? `^${c.deg}`}`;
  return logPart === "" ? `O(${nPart})` : `O(${nPart} ${logPart})`;
}
