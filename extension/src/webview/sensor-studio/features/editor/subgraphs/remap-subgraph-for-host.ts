import type { Edge, Node } from "@xyflow/react";
import { groupBoundaryNodeIds, groupBoundaryNodeIdsForHost } from "./studio-subgraph.types";

export function remapSubgraphForHost(
  sub: { nodes: Node[]; edges: Edge[] },
  hostNodeId: string,
  subgraphKey: string,
): { nodes: Node[]; edges: Edge[] } {
  const base = groupBoundaryNodeIds(subgraphKey);
  const hostBoundary = groupBoundaryNodeIdsForHost(hostNodeId, subgraphKey);
  const nodeById = new Map(sub.nodes.map((n) => [n.id, n]));

  const mapId = (id: string) => {
    const node = nodeById.get(id);
    if (node?.type === "studio-group-input") {
      return hostBoundary.input;
    }
    if (node?.type === "studio-group-output") {
      return hostBoundary.output;
    }
    if (id === base.input) {
      return hostBoundary.input;
    }
    if (id === base.output) {
      return hostBoundary.output;
    }
    if (id.startsWith(`${hostNodeId}__`)) {
      return id;
    }
    return `${hostNodeId}__${id}`;
  };

  return {
    nodes: sub.nodes.map((n) => {
      if (n.type === "studio-group-input") {
        return { ...n, id: hostBoundary.input };
      }
      if (n.type === "studio-group-output") {
        return { ...n, id: hostBoundary.output };
      }
      return { ...n, id: mapId(n.id) };
    }),
    edges: sub.edges.map((e) => ({
      ...e,
      id: `flat_${hostNodeId}_${e.id}`,
      source: mapId(e.source),
      target: mapId(e.target),
    })),
  };
}
