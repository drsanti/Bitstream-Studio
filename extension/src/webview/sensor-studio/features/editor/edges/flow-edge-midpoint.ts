import type { Edge, Node } from "@xyflow/react";
import { flowNodeCenter } from "./flow-node-layout-bounds";

/** Flow position for inserting a reroute on an edge (node centers or handle midpoint). */
export function resolveFlowEdgeMidpointPosition(
  nodes: readonly Node[],
  edge: Pick<Edge, "source" | "target">,
): { x: number; y: number } | null {
  const source = nodes.find((n) => n.id === edge.source);
  const target = nodes.find((n) => n.id === edge.target);
  if (source == null || target == null) {
    return null;
  }
  const sourceCenter = flowNodeCenter(source);
  const targetCenter = flowNodeCenter(target);
  return {
    x: (sourceCenter.x + targetCenter.x) / 2,
    y: (sourceCenter.y + targetCenter.y) / 2,
  };
}
