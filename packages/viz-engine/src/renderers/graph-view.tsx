import type { CSSProperties } from "react";
import { STATUS_TOKEN } from "../palette";
import { edgeActive, elementStatus, type VisualState } from "../state/visual-state";

const VB_W = 700;
const VB_H = 560;
const PAD = 44;
const R = 22;

export interface GraphViewProps {
  state: VisualState;
  animate?: boolean;
  className?: string;
}

/** Graph renderer (BFS/DFS). Uses the trace's preset node coordinates — deterministic, force-free. */
export function GraphView({ state, animate = true, className }: GraphViewProps) {
  const sx = (x: number) => PAD + x * (VB_W - 2 * PAD);
  const sy = (y: number) => PAD + y * (VB_H - 2 * PAD);
  const pos = new Map(state.graphNodes.map((n) => [n.id, n]));
  const transition: CSSProperties = animate ? { transition: "fill 0.18s ease-out" } : {};

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      role="img"
      aria-label={`Graph with ${state.graphNodes.length} nodes${state.annotation ? `. ${state.annotation}` : ""}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <g aria-hidden="true">
        {state.graphEdges.map((e) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          const active = edgeActive(state, e.id);
          return (
            <line
              key={e.id}
              x1={sx(a.x)}
              y1={sy(a.y)}
              x2={sx(b.x)}
              y2={sy(b.y)}
              stroke={active ? "var(--viz-frontier)" : "var(--viz-edge, #2A3140)"}
              strokeWidth={active ? 3.5 : 2}
              style={transition}
            />
          );
        })}
      </g>
      {state.graphNodes.map((node) => {
        const status = elementStatus(state, node.id);
        return (
          <g key={node.id}>
            <circle
              cx={sx(node.x)}
              cy={sy(node.y)}
              r={R}
              fill={STATUS_TOKEN[status]}
              stroke="var(--viz-edge, #2A3140)"
              strokeWidth={status === "default" ? 1 : 2}
              style={transition}
            />
            <text
              x={sx(node.x)}
              y={sy(node.y)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={15}
              fontFamily="var(--font-mono, monospace)"
              fill="var(--viz-on-fill, #0B0E14)"
              fontWeight={600}
            >
              {node.label ?? node.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
