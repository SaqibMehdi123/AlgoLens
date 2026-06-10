"use client";

import { basis, type CandidateClass, type EmpiricalResult } from "@algolens/complexity";
import { useState } from "react";

const W = 560;
const H = 320;
const PAD = { l: 56, r: 16, t: 16, b: 40 };

/**
 * Growth chart (docs/05 §5.4): measured samples + the two best fitted curves, R² labels,
 * log-log toggle. Pure SVG, token colors only.
 */
export function GrowthChart({ result }: { result: EmpiricalResult }) {
  const [logLog, setLogLog] = useState(true);
  const measure = result.measure;
  const ys = result.samples.map((s) => (measure === "ops" ? (s.ops ?? 0) : s.ms));
  const ns = result.samples.map((s) => s.n);
  if (ns.length < 2) return null;

  const nMax = Math.max(...ns);
  const nMin = Math.min(...ns);
  const yMax = Math.max(...ys, 1e-6);
  const yMin = Math.max(Math.min(...ys.filter((y) => y > 0), yMax), yMax / 1e6);

  const tx = (n: number) =>
    PAD.l +
    ((logLog ? Math.log2(n) - Math.log2(nMin) : n - nMin) /
      (logLog ? Math.log2(nMax) - Math.log2(nMin) : nMax - nMin || 1)) *
      (W - PAD.l - PAD.r);
  const ty = (y: number) => {
    const clamped = Math.max(y, yMin);
    const t = logLog
      ? (Math.log10(clamped) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin) || 1)
      : (clamped - 0) / (yMax || 1);
    return H - PAD.b - t * (H - PAD.t - PAD.b);
  };

  function curvePath(cls: CandidateClass): string {
    const c = result.coefficients[cls];
    const points: string[] = [];
    for (let i = 0; i <= 40; i++) {
      const n = logLog
        ? Math.pow(2, Math.log2(nMin) + ((Math.log2(nMax) - Math.log2(nMin)) * i) / 40)
        : nMin + ((nMax - nMin) * i) / 40;
      const y = c * basis(cls, n, result.maxN);
      if (!Number.isFinite(y) || y <= 0) continue;
      points.push(`${points.length === 0 ? "M" : "L"}${tx(n).toFixed(1)},${ty(y).toFixed(1)}`);
    }
    return points.join(" ");
  }

  const xTicks = ns;
  const yTickVals = logLog
    ? Array.from(
        { length: Math.floor(Math.log10(yMax)) - Math.floor(Math.log10(yMin)) + 1 },
        (_, i) => Math.pow(10, Math.floor(Math.log10(yMin)) + i),
      )
    : [0.25, 0.5, 0.75, 1].map((f) => yMax * f);

  return (
    <figure className="rounded-xl border border-subtle bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <figcaption className="text-sm font-medium text-foreground">
          Measured growth{" "}
          <span className="font-mono text-xs text-secondary">
            ({measure === "ops" ? "operation counts — noise-free" : "wall time, ms"})
          </span>
        </figcaption>
        <label className="flex items-center gap-1.5 text-xs text-secondary">
          <input type="checkbox" checked={logLog} onChange={() => setLogLog(!logLog)} className="accent-[var(--primary)]" />
          log–log
        </label>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Growth chart of measured runtime vs input size with fitted curves">
        {/* gridlines + axes */}
        {yTickVals.map((y) => (
          <g key={y}>
            <line x1={PAD.l} x2={W - PAD.r} y1={ty(y)} y2={ty(y)} stroke="var(--subtle)" strokeWidth={1} />
            <text x={PAD.l - 6} y={ty(y) + 4} textAnchor="end" fontSize={10} fill="var(--muted-fg)" fontFamily="var(--font-mono)">
              {y >= 1000 ? `${(y / 1000).toFixed(0)}k` : y.toPrecision(2)}
            </text>
          </g>
        ))}
        {xTicks.map((n) => (
          <text key={n} x={tx(n)} y={H - PAD.b + 16} textAnchor="middle" fontSize={10} fill="var(--muted-fg)" fontFamily="var(--font-mono)">
            {n}
          </text>
        ))}
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="var(--subtle)" strokeWidth={1.5} />
        <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} stroke="var(--subtle)" strokeWidth={1.5} />

        {/* fitted curves: best (mint) + runner-up (violet, dashed) */}
        <path d={curvePath(result.runnerUp)} fill="none" stroke="var(--viz-visited)" strokeWidth={1.5} strokeDasharray="5 4" />
        <path d={curvePath(result.bestFit)} fill="none" stroke="var(--viz-sorted)" strokeWidth={2} />

        {/* measured points */}
        {result.samples.map((s, i) => (
          <circle key={s.n} cx={tx(s.n)} cy={ty(Math.max(ys[i]!, yMin))} r={4} fill="var(--viz-compare)" stroke="var(--background)" strokeWidth={1.5} />
        ))}
      </svg>

      <div className="mt-2 flex flex-wrap gap-4 font-mono text-xs">
        <span className="flex items-center gap-1.5 text-secondary">
          <span className="inline-block h-0.5 w-5 bg-sorted" /> best: {result.bestFit} · R² {result.r2.toFixed(3)}
        </span>
        <span className="flex items-center gap-1.5 text-secondary">
          <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-[var(--viz-visited)]" /> runner-up: {result.runnerUp}
        </span>
        <span className="flex items-center gap-1.5 text-secondary">
          <span className="inline-block size-2 rounded-full bg-compare" /> measured
        </span>
      </div>
    </figure>
  );
}
