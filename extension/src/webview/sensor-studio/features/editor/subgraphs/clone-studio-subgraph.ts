import type { Edge, Node } from "@xyflow/react";
import type { StudioNodeGroupData, StudioSubgraphDocument } from "./studio-subgraph.types";
import { groupBoundaryNodeIds } from "./studio-subgraph.types";

function newGroupKey(): string {
  return `group_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function newInnerNodeId(toKey: string, index: number): string {
  return `${toKey}_n_${index}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Deep-clone a subgraph (and nested group subgraphs) under a new subgraph key.
 * Boundary nodes use `${toKey}_input` / `${toKey}_output`.
 */
export function cloneStudioSubgraphDeep(
  subgraphs: Record<string, StudioSubgraphDocument>,
  sourceSubgraphId: string,
  targetSubgraphId: string,
): Record<string, StudioSubgraphDocument> {
  const pool = { ...subgraphs };
  const source = pool[sourceSubgraphId];
  if (source == null) {
    return pool;
  }
  pool[targetSubgraphId] = cloneOneSubgraph(source, sourceSubgraphId, targetSubgraphId, pool);
  return pool;
}

function cloneOneSubgraph(
  sub: StudioSubgraphDocument,
  fromKey: string,
  toKey: string,
  pool: Record<string, StudioSubgraphDocument>,
): StudioSubgraphDocument {
  const idMap = new Map<string, string>();
  const nestedSubgraphByOldNodeId = new Map<string, string>();

  const mapId = (oldId: string, index: number): string => {
    if (idMap.has(oldId)) {
      return idMap.get(oldId)!;
    }
    const base = groupBoundaryNodeIds(fromKey);
    if (oldId === base.input || oldId === `${fromKey}_input`) {
      const next = `${toKey}_input`;
      idMap.set(oldId, next);
      return next;
    }
    if (oldId === base.output || oldId === `${fromKey}_output`) {
      const next = `${toKey}_output`;
      idMap.set(oldId, next);
      return next;
    }
    const next = newInnerNodeId(toKey, index);
    idMap.set(oldId, next);
    return next;
  };

  sub.nodes.forEach((node, index) => {
    if (node.type === "studio-node-group") {
      const nestedKey = (node.data as StudioNodeGroupData).subgraphId ?? node.id;
      const nestedSub = pool[nestedKey];
      const newNestedKey = newGroupKey();
      const newHostId = newGroupKey();
      if (nestedSub != null) {
        pool[newNestedKey] = cloneOneSubgraph(nestedSub, nestedKey, newNestedKey, pool);
      }
      idMap.set(node.id, newHostId);
      nestedSubgraphByOldNodeId.set(node.id, newNestedKey);
      return;
    }
    mapId(node.id, index);
  });

  const nodes: Node[] = sub.nodes.map((node, index) => {
    const newId = node.type === "studio-node-group" ? idMap.get(node.id)! : mapId(node.id, index);
    if (node.type === "studio-node-group") {
      const newNestedKey = nestedSubgraphByOldNodeId.get(node.id)!;
      return {
        ...structuredClone(node),
        id: newId,
        data: {
          ...(node.data as StudioNodeGroupData),
          subgraphId: newNestedKey,
        },
      };
    }
    if (node.type === "studio-group-input" || node.type === "studio-group-output") {
      return {
        ...structuredClone(node),
        id: newId,
        data: { ...node.data, interface: structuredClone(sub.interface) },
      };
    }
    return { ...structuredClone(node), id: newId };
  });

  const edges: Edge[] = sub.edges.map((edge) => ({
    ...structuredClone(edge),
    id: `${toKey}_e_${edge.id}`,
    source: idMap.get(edge.source) ?? edge.source,
    target: idMap.get(edge.target) ?? edge.target,
  }));

  return {
    nodes,
    edges,
    interface: structuredClone(sub.interface),
    ...(sub.graphTitle != null ? { graphTitle: sub.graphTitle } : {}),
  };
}
