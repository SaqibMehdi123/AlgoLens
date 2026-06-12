/** Result comparison shared by client sample runs and (mirrored in) the server judge. */
export type CompareMode = "exact" | "unordered";

export function resultsEqual(actual: unknown, expected: unknown, mode: CompareMode): boolean {
  if (mode === "unordered") {
    if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
    const norm = (a: unknown[]) => a.map((x) => JSON.stringify(x)).sort();
    return JSON.stringify(norm(actual)) === JSON.stringify(norm(expected));
  }
  return JSON.stringify(actual) === JSON.stringify(expected);
}
