import type { CSSProperties } from "react";
import { layoutTree } from "../layout/tree";
import { STATUS_TOKEN } from "../palette";
import { elementStatus, type VisualState } from "../state/visual-state";

const VB_W = 820;
const VB_H = 460;
const R = 21;

export interface TreeViewProps {
  state: VisualState;
  animate?: boolean;
  className?: string;
}

/** Tidy-tree SVG renderer (BST). Node positions come from d3-hierarchy via {@link layoutTree}. */
export function TreeView({ state, animate = true, className }: TreeViewProps) {
  const { nodes, edges } = layoutTree(state.treeNodes, VB_W, VB_H);
  const pos = new Map(nodes.map((n) => [n.id, n]));
  const transition: CSSProperties = animate
    ? { transition: "cx 0.32s cubic-bezier(0.22,1,0.36,1), cy 0.32s cubic-bezier(0.22,1,0.36,1), fill 0.18s ease-out" }
    : {};

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      role="img"
      aria-label={`Binary search tree with ${nodes.length} nodes${state.annotation ? `. ${state.annotation}` : ""}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <g aria-hidden="true">
        {edges.map((e) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          return (
            <line
              key={`${e.from}-${e.to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="var(--viz-edge, #2A3140)"
              strokeWidth={2}
            />
          );
        })}
      </g>
      {nodes.map((node) => {
        const status = elementStatus(state, node.id);
        return (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={R}
              fill={STATUS_TOKEN[status]}
              stroke="var(--viz-edge, #2A3140)"
              strokeWidth={status === "default" ? 1 : 2}
              style={transition}
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={15}
              fontFamily="var(--font-mono, monospace)"
              fill="var(--viz-on-fill, #0B0E14)"
              fontWeight={600}
            >
              {node.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
