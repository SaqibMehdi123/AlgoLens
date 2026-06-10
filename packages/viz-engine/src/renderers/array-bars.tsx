import type { CSSProperties } from "react";
import { STATUS_MARK, STATUS_TOKEN } from "../palette";
import { elementStatus, type VisualState } from "../state/visual-state";

const VB_W = 1000;
const VB_H = 380;
const LABEL_AREA = 30;
const TOP_PAD = 16;

export interface ArrayBarsProps {
  state: VisualState;
  /** When false (reduced motion), bars snap to position instead of tweening. */
  animate?: boolean;
  className?: string;
}

/** SVG bar renderer for array algorithms. Pure function of the derived visual state. */
export function ArrayBars({ state, animate = true, className }: ArrayBarsProps) {
  const values = state.values;
  const n = values.length;
  const maxVal = Math.max(1, ...values, state.needle ?? 0);
  const baseline = VB_H - LABEL_AREA;
  const slot = VB_W / Math.max(n, 1);
  const gap = Math.min(slot * 0.18, 10);
  const barWidth = Math.max(slot - gap, 1);
  const showLabels = n <= 40;

  const transition: CSSProperties = animate
    ? { transition: "x 0.32s cubic-bezier(0.22,1,0.36,1), fill 0.18s ease-out, height 0.32s cubic-bezier(0.22,1,0.36,1)" }
    : {};

  const needleY =
    state.needle != null ? baseline - (state.needle / maxVal) * (baseline - TOP_PAD) : null;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      role="img"
      aria-label={`Array of ${n} elements${state.annotation ? `. ${state.annotation}` : ""}`}
      className={className}
      preserveAspectRatio="xMidYMax meet"
    >
      {needleY != null && (
        <g aria-hidden="true">
          <line
            x1={0}
            x2={VB_W}
            y1={needleY}
            y2={needleY}
            stroke="var(--viz-needle)"
            strokeWidth={1.5}
            strokeDasharray="6 6"
            opacity={0.7}
          />
          <text x={8} y={needleY - 6} fill="var(--viz-needle)" fontSize={13} fontFamily="var(--font-mono, monospace)">
            target {state.needle}
          </text>
        </g>
      )}
      {values.map((value, i) => {
        const status = elementStatus(state, i);
        const height = (value / maxVal) * (baseline - TOP_PAD);
        const x = i * slot + gap / 2;
        const y = baseline - height;
        const mark = STATUS_MARK[status];
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(height, 1)}
              rx={Math.min(barWidth / 4, 4)}
              fill={STATUS_TOKEN[status]}
              style={transition}
            />
            {showLabels && (
              <text
                x={x + barWidth / 2}
                y={baseline + 18}
                textAnchor="middle"
                fontSize={Math.min(barWidth * 0.7, 14)}
                fill="var(--viz-text-muted, #9AA4B8)"
                fontFamily="var(--font-mono, monospace)"
              >
                {value}
              </text>
            )}
            {mark && barWidth > 10 && (
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize={13}
                fill={STATUS_TOKEN[status]}
              >
                {mark}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
