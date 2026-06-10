/**
 * Tidy tree layout via d3-hierarchy (used as a math library only, per TRD §2 — D3 never renders).
 * Lays out the currently-present nodes, so a BST visibly grows as `set` steps reveal children.
 */
import { stratify, tree } from "d3-hierarchy";
import type { TreeNodeState } from "../state/visual-state";

export interface LaidOutNode {
  id: string;
  value: number;
  x: number;
  y: number;
}

export interface LaidOutEdge {
  from: string;
  to: string;
}

export interface TreeLayout {
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
}

export function layoutTree(
  treeNodes: TreeNodeState[],
  width: number,
  height: number,
  pad = 36,
): TreeLayout {
  const present = treeNodes.filter((n) => n.present);
  if (present.length === 0) return { nodes: [], edges: [] };

  const root = stratify<TreeNodeState>()
    .id((d) => d.id)
    .parentId((d) => d.parent ?? undefined)(present);

  const laid = tree<TreeNodeState>().size([Math.max(width - 2 * pad, 1), Math.max(height - 2 * pad, 1)])(
    root,
  );

  const nodes: LaidOutNode[] = laid.descendants().map((d) => ({
    id: d.data.id,
    value: d.data.value,
    x: d.x + pad,
    y: d.y + pad,
  }));
  const edges: LaidOutEdge[] = laid.links().map((l) => ({
    from: l.source.data.id,
    to: l.target.data.id,
  }));

  return { nodes, edges };
}
