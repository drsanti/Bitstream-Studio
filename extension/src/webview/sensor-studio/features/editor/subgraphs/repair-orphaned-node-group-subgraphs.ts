import type { FlowGraphNode } from "../store/flow-editor.store";
import { createEmptySubgraphDocument } from "./create-studio-node-group";
import {
  isStudioNodeGroupNode,
  type StudioSubgraphDocument,
} from "./studio-subgraph.types";

function readGraphTitle(node: FlowGraphNode): string {
  const data = node.data as { graphTitle?: string };
  const title = typeof data.graphTitle === "string" ? data.graphTitle.trim() : "";
  return title.length > 0 ? title : "Node Group";
}

/**
 * Ensures every `studio-node-group` host on the graph has a matching `subgraphs` entry.
 * Older saves and partial imports could leave shell nodes without inner documents — Tab / Enter then no-op.
 */
export function repairOrphanedNodeGroupSubgraphs(
  subgraphs: Record<string, StudioSubgraphDocument>,
  rootNodes: readonly FlowGraphNode[],
): Record<string, StudioSubgraphDocument> {
  const next = { ...subgraphs };
  let changed = false;
  /** Avoid infinite recursion when a subgraph contains its own host or cyclic group links. */
  const visitedSubgraphIds = new Set<string>();

  const visitHosts = (nodes: readonly FlowGraphNode[]) => {
    for (const node of nodes) {
      if (!isStudioNodeGroupNode(node)) {
        continue;
      }
      const subgraphId = node.data.subgraphId ?? node.id;
      if (next[subgraphId] == null) {
        next[subgraphId] = createEmptySubgraphDocument(
          subgraphId,
          readGraphTitle(node),
        );
        changed = true;
      }
      if (visitedSubgraphIds.has(subgraphId)) {
        continue;
      }
      visitedSubgraphIds.add(subgraphId);
      visitHosts(next[subgraphId]!.nodes as FlowGraphNode[]);
    }
  };

  visitHosts(rootNodes);
  return changed ? next : subgraphs;
}
