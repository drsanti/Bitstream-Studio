import type { Edge, Node } from "@xyflow/react";
import type { FlowCanvasEdgeBusLaneSort } from "../../../persistence/flow-canvas-preferences";
import { sourceBundleGroupKey } from "./flow-edge-bundle-offset";
import { flowNodeCenter } from "./flow-node-layout-bounds";
import { symmetricOffsetsForEdgeGroups } from "./flow-edge-offset-groups";

function groupEdgesBySource(
  edges: readonly Edge[],
): Map<string, Edge[]> {
  const groups = new Map<string, Edge[]>();
  for (const edge of edges) {
    const key = sourceBundleGroupKey(edge);
    const list = groups.get(key);
    if (list != null) {
      list.push(edge);
    } else {
      groups.set(key, [edge]);
    }
  }
  return groups;
}

function sortKeyForTarget(
  edge: Edge,
  nodeById: ReadonlyMap<string, Node>,
  sort: FlowCanvasEdgeBusLaneSort,
): number {
  const target = edge.target != null ? nodeById.get(edge.target) : undefined;
  if (target == null) {
    return 0;
  }
  const center = flowNodeCenter(target);
  return sort === "horizontal" ? center.x : center.y;
}

/**
 * Orders fan-out wires from the same source socket by target position (bus lanes after layout).
 * Stacks on existing `pathOptions.offset`.
 */
export function applyEdgeBusLaneOffsets(
  edges: readonly Edge[],
  nodeById: ReadonlyMap<string, Node>,
  spacingPx: number,
  sort: FlowCanvasEdgeBusLaneSort,
): Edge[] {
  if (spacingPx <= 0 || nodeById.size === 0) {
    return edges.map((e) => e);
  }

  const orderedGroups = new Map<string, Edge[]>();
  for (const [key, group] of groupEdgesBySource(edges)) {
    if (group.length < 2) {
      continue;
    }
    orderedGroups.set(
      key,
      [...group].sort(
        (a, b) => sortKeyForTarget(a, nodeById, sort) - sortKeyForTarget(b, nodeById, sort),
      ),
    );
  }

  const offsetById = symmetricOffsetsForEdgeGroups(orderedGroups, spacingPx);
  if (offsetById.size === 0) {
    return edges.map((e) => e);
  }

  return edges.map((edge) => {
    const delta = offsetById.get(edge.id);
    if (delta == null || delta === 0) {
      return edge;
    }
    const existing =
      typeof edge.pathOptions?.offset === "number" ? edge.pathOptions.offset : 0;
    return {
      ...edge,
      pathOptions: { ...(edge.pathOptions ?? {}), offset: existing + delta },
    };
  });
}
