import type { Edge, Node } from "@xyflow/react";
import type { StudioGroupInterface, StudioSubgraphDocument } from "./studio-subgraph.types";
import { findGroupInputSocket, findGroupOutputSocket } from "./studio-group-boundary-sockets";

/** Rewire parent-graph edges that crossed the group boundary onto the new node group shell. */
export function rewireParentGraphForStudioGroup(
  nodes: Node[],
  edges: Edge[],
  groupNode: Node,
  selectedIds: Set<string>,
  iface: StudioGroupInterface,
  subgraphs?: Record<string, StudioSubgraphDocument>,
): { nodes: Node[]; edges: Edge[] } {
  const parentNodes = nodes.filter((n) => !selectedIds.has(n.id)).concat(groupNode);
  const parentEdges: Edge[] = [];
  const parentIncomingKeys = new Set<string>();

  for (const edge of edges) {
    const srcIn = selectedIds.has(edge.source);
    const tgtIn = selectedIds.has(edge.target);

    if (srcIn && tgtIn) {
      continue;
    }

    if (!srcIn && tgtIn) {
      const target = nodes.find((n) => n.id === edge.target);
      const sock = findGroupInputSocket(iface, target, edge.targetHandle, subgraphs, {
        externalSourceId: edge.source,
        externalSourceHandle: edge.sourceHandle,
      });
      if (sock == null) {
        continue;
      }
      const incomingKey = `${edge.source}|${edge.sourceHandle ?? ""}|${groupNode.id}|${sock.id}`;
      if (parentIncomingKeys.has(incomingKey)) {
        continue;
      }
      parentIncomingKeys.add(incomingKey);
      parentEdges.push({
        ...edge,
        id: `grp_${edge.id}`,
        target: groupNode.id,
        targetHandle: sock.id,
      });
      continue;
    }

    if (srcIn && !tgtIn) {
      const source = nodes.find((n) => n.id === edge.source);
      const sock = findGroupOutputSocket(iface, source, edge.sourceHandle, subgraphs);
      if (sock == null) {
        continue;
      }
      parentEdges.push({
        ...edge,
        id: `grp_${edge.id}`,
        source: groupNode.id,
        sourceHandle: sock.id,
      });
      continue;
    }

    if (!srcIn && !tgtIn) {
      parentEdges.push(edge);
    }
  }

  return { nodes: parentNodes, edges: parentEdges };
}
