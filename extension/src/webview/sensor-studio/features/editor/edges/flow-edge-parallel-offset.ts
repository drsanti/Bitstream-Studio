import type { Edge } from "@xyflow/react";
import { symmetricOffsetsForEdgeGroups } from "./flow-edge-offset-groups";

/** Stable key for wires between the same two nodes (order-independent). */
export function parallelEdgeGroupKey(edge: Edge): string {
  const a = edge.source ?? "";
  const b = edge.target ?? "";
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Assigns React Flow `pathOptions.offset` so multiple wires between the same node pair fan apart.
 * Returns a new edge array; spacing 0 leaves offsets at 0.
 */
export function applyParallelEdgeOffsets(
  edges: readonly Edge[],
  spacingPx: number,
): Edge[] {
  if (spacingPx <= 0) {
    return edges.map((e) => e);
  }

  const groups = new Map<string, Edge[]>();
  for (const edge of edges) {
    const key = parallelEdgeGroupKey(edge);
    const list = groups.get(key);
    if (list != null) {
      list.push(edge);
    } else {
      groups.set(key, [edge]);
    }
  }

  const offsetById = symmetricOffsetsForEdgeGroups(groups, spacingPx);

  return edges.map((edge) => {
    const offset = offsetById.get(edge.id);
    if (offset == null || offset === 0) {
      return edge;
    }
    const existing = edge.pathOptions ?? {};
    return {
      ...edge,
      pathOptions: { ...existing, offset },
    };
  });
}
