/**
 * Verdict merge (TRD §5.4): the layers are corroborating witnesses, never a single oracle.
 * Agreement → high confidence. Divergence → present BOTH with likely reasons — disagreement
 * is a designed state, not an error.
 */
import type { StaticResult } from "./static/analyze";
import type { EmpiricalResult } from "./empirical/run";

export interface Verdict {
  mode: "agree" | "diverge" | "static-only" | "empirical-only" | "none";
  final: string | null;
  confidence: "low" | "medium" | "high";
  staticBigO: string | null;
  empiricalBigO: string | null;
  reasons: string[];
}

const capMedium = (c: "low" | "medium" | "high"): "low" | "medium" =>
  c === "high" ? "medium" : c;

export function mergeVerdict(
  staticR: StaticResult | null,
  empiricalR: EmpiricalResult | null,
): Verdict {
  if (!staticR && !empiricalR) {
    return {
      mode: "none",
      final: null,
      confidence: "low",
      staticBigO: null,
      empiricalBigO: null,
      reasons: ["neither analysis layer produced a result"],
    };
  }

  if (staticR && !empiricalR) {
    return {
      mode: "static-only",
      final: staticR.bigO,
      confidence: capMedium(staticR.confidence),
      staticBigO: staticR.bigO,
      empiricalBigO: null,
      reasons: ["only static analysis available — no empirical corroboration yet"],
    };
  }

  if (!staticR && empiricalR) {
    const conf = empiricalR.r2 > 0.99 && !empiricalR.budgetExhausted ? "medium" : "low";
    return {
      mode: "empirical-only",
      final: empiricalR.bestFit,
      confidence: conf,
      staticBigO: null,
      empiricalBigO: empiricalR.bestFit,
      reasons: ["static analysis unavailable (e.g. parse error) — empirical fit only"],
    };
  }

  const s = staticR!;
  const e = empiricalR!;

  if (s.bigO === e.bestFit) {
    // Both witnesses agree; static unresolved items still temper the confidence.
    const confidence = s.confidence === "low" ? "medium" : "high";
    return {
      mode: "agree",
      final: s.bigO,
      confidence,
      staticBigO: s.bigO,
      empiricalBigO: e.bestFit,
      reasons: [],
    };
  }

  const reasons: string[] = [];
  if (e.budgetExhausted) {
    reasons.push(
      "the empirical run hit its budget at small n — growth too steep to measure further " +
        "(strong exponential signal); its fit covers only the sizes it reached",
    );
  }
  if (s.unresolved.length > 0) {
    reasons.push(
      `static analysis is partial (${s.unresolved.length} unresolved construct${
        s.unresolved.length > 1 ? "s" : ""
      }) — its estimate may be conservative`,
    );
  }
  if (s.bigO === e.runnerUp || e.r2 < 0.98) {
    reasons.push(
      "the empirical samples fit two classes almost equally well — constants, JIT warm-up, and " +
        "cache effects can fool small-n fits",
    );
  }
  reasons.push(
    "static analysis reasons about the worst case; the empirical layer measures THIS input " +
      "family — an algorithm can be quadratic in theory yet behave linearly on these inputs",
  );

  return {
    mode: "diverge",
    final: null,
    confidence: "low",
    staticBigO: s.bigO,
    empiricalBigO: e.bestFit,
    reasons,
  };
}
