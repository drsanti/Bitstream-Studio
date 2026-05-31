import type { FlowGraphNode } from "../store/flow-editor.store";
import type { StudioNodeGroupData, StudioSubgraphDocument } from "./studio-subgraph.types";
import { emptyGroupInterface, isStudioNodeGroupNode } from "./studio-subgraph.types";
import { cloneStudioSubgraphDeep } from "./clone-studio-subgraph";

function resolveSourceSubgraphKey(
  node: FlowGraphNode,
  data: StudioNodeGroupData,
  pool: Record<string, StudioSubgraphDocument>,
  idMap?: Map<string, string>,
): string {
  const candidates: string[] = [];
  if (typeof data.subgraphId === "string") {
    candidates.push(data.subgraphId);
  }
  if (idMap != null) {
    const formerHostId = [...idMap.entries()].find(([, nextId]) => nextId === node.id)?.[0];
    if (formerHostId != null) {
      candidates.push(formerHostId);
    }
  }
  candidates.push(node.id);

  for (const key of candidates) {
    if (pool[key] != null) {
      return key;
    }
  }
  return data.subgraphId ?? node.id;
}

/**
 * After clipboard paste or duplicate, give each pasted `studio-node-group` its own subgraph
 * document (deep clone) keyed by the new host node id.
 */
export function attachSubgraphsForPastedNodeGroups(
  pastedNodes: FlowGraphNode[],
  storeSubgraphs: Record<string, StudioSubgraphDocument>,
  clipboardSubgraphs: Record<string, StudioSubgraphDocument> | undefined,
  idMap?: Map<string, string>,
): { nodes: FlowGraphNode[]; subgraphs: Record<string, StudioSubgraphDocument> } {
  const lookupPool = { ...storeSubgraphs, ...(clipboardSubgraphs ?? {}) };
  let nextSubgraphs = { ...storeSubgraphs };

  const nodes = pastedNodes.map((node) => {
    if (!isStudioNodeGroupNode(node)) {
      return node;
    }

    const data = node.data;
    const sourceSubgraphId = resolveSourceSubgraphKey(node, data, lookupPool, idMap);
    const newSubgraphId = node.id;

    if (lookupPool[sourceSubgraphId] != null) {
      nextSubgraphs = cloneStudioSubgraphDeep(
        { ...lookupPool, ...nextSubgraphs },
        sourceSubgraphId,
        newSubgraphId,
      );
    } else {
      nextSubgraphs[newSubgraphId] = {
        nodes: [],
        edges: [],
        interface: emptyGroupInterface(),
      };
    }

    return {
      ...node,
      data: {
        ...data,
        subgraphId: newSubgraphId,
      },
    };
  });

  return { nodes, subgraphs: nextSubgraphs };
}
