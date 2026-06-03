import type { Edge } from "@xyflow/react";

/** Edge ids for `edgeId` and all wires downstream of its target node. */
export function collectDownstreamEdgeIds(
  edgeId: string,
  edges: readonly Edge[],
): ReadonlySet<string> {
  const start = edges.find((e) => e.id === edgeId);
  if (start == null) {
    return new Set();
  }
  if (start.target == null) {
    return new Set([edgeId]);
  }

  const result = new Set<string>([edgeId]);
  const queue = [start.target];
  const seenNodes = new Set<string>();

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (seenNodes.has(nodeId)) {
      continue;
    }
    seenNodes.add(nodeId);
    for (const edge of edges) {
      if (edge.source !== nodeId) {
        continue;
      }
      result.add(edge.id);
      if (edge.target != null && !seenNodes.has(edge.target)) {
        queue.push(edge.target);
      }
    }
  }

  return result;
}
