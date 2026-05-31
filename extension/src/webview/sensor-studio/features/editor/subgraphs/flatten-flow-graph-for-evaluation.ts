import type { Edge, Node } from "@xyflow/react";
import type { StudioNodeGroupData, StudioSubgraphDocument } from "./studio-subgraph.types";
import { findGroupBoundaryNode, isStudioNodeGroupNode } from "./studio-subgraph.types";
import { remapSubgraphForHost } from "./remap-subgraph-for-host";

/**
 * Expands `studio-node-group` shells into internal wiring for simulation / evaluation.
 * Recursively flattens nested groups.
 */
export function flattenFlowGraphForEvaluation(
  rootNodes: Node[],
  rootEdges: Edge[],
  subgraphs: Record<string, StudioSubgraphDocument>,
): { nodes: Node[]; edges: Edge[] } {
  return flattenGraphLayer(rootNodes, rootEdges, subgraphs, new Set());
}

function flattenGraphLayer(
  nodes: Node[],
  edges: Edge[],
  subgraphs: Record<string, StudioSubgraphDocument>,
  expanding: Set<string>,
): { nodes: Node[]; edges: Edge[] } {
  const groupNodes = nodes.filter((n) => isStudioNodeGroupNode(n));
  if (groupNodes.length === 0) {
    return { nodes, edges };
  }

  const groupIds = new Set(groupNodes.map((n) => n.id));
  const expandedSubs = new Map<string, { nodes: Node[]; edges: Edge[] }>();

  for (const group of groupNodes) {
    const subKey = (group.data as StudioNodeGroupData).subgraphId ?? group.id;
    if (expanding.has(subKey)) {
      continue;
    }
    const sub = subgraphs[subKey];
    if (sub == null) {
      continue;
    }
    expanding.add(subKey);
    const flattened = flattenGraphLayer(sub.nodes, sub.edges, subgraphs, expanding);
    expanding.delete(subKey);
    expandedSubs.set(group.id, remapSubgraphForHost(flattened, group.id, subKey));
  }

  const flatNodes: Node[] = nodes.filter((n) => !isStudioNodeGroupNode(n));
  const flatEdges: Edge[] = [];

  for (const edge of edges) {
    const targetsGroup = groupIds.has(edge.target);
    const sourcesGroup = groupIds.has(edge.source);

    if (!targetsGroup && !sourcesGroup) {
      flatEdges.push({ ...edge });
      continue;
    }

    if (targetsGroup) {
      const hostId = edge.target;
      const sub = expandedSubs.get(hostId);
      if (sub == null) {
        continue;
      }
      const inputNode = findGroupBoundaryNode(sub.nodes, "input");
      if (inputNode == null) {
        continue;
      }
      const inputNodeId = inputNode.id;
      for (const ie of sub.edges) {
        if (ie.source !== inputNodeId) {
          continue;
        }
        if (edge.targetHandle && ie.sourceHandle !== edge.targetHandle) {
          continue;
        }
        flatEdges.push({
          ...edge,
          id: `flat_in_${edge.id}_${ie.id}`,
          target: ie.target,
          targetHandle: ie.targetHandle,
        });
      }
      continue;
    }

    if (sourcesGroup) {
      const hostId = edge.source;
      const sub = expandedSubs.get(hostId);
      if (sub == null) {
        continue;
      }
      const outputNode = findGroupBoundaryNode(sub.nodes, "output");
      if (outputNode == null) {
        continue;
      }
      const outputNodeId = outputNode.id;
      for (const ie of sub.edges) {
        if (ie.target !== outputNodeId) {
          continue;
        }
        if (edge.sourceHandle && ie.targetHandle !== edge.sourceHandle) {
          continue;
        }
        flatEdges.push({
          ...edge,
          id: `flat_out_${edge.id}_${ie.id}`,
          source: ie.source,
          sourceHandle: ie.sourceHandle,
        });
      }
    }
  }

  for (const group of groupNodes) {
    const sub = expandedSubs.get(group.id);
    if (sub == null) {
      continue;
    }
    flatNodes.push(
      ...sub.nodes.filter(
        (n) => n.type !== "studio-group-input" && n.type !== "studio-group-output",
      ),
    );
    flatEdges.push(
      ...sub.edges.filter((e) => {
        const src = sub.nodes.find((n) => n.id === e.source);
        const tgt = sub.nodes.find((n) => n.id === e.target);
        return src?.type !== "studio-group-input" && tgt?.type !== "studio-group-output";
      }),
    );
  }

  return { nodes: flatNodes, edges: flatEdges };
}
