import type { FlowGraphNode } from "../store/flow-editor.store";
import { isStudioNodeGroupNode } from "./studio-subgraph.types";

export function resolveNodeGroupSubgraphIdFromNode(
  node: FlowGraphNode | undefined,
): string | null {
  if (node == null || !isStudioNodeGroupNode(node)) {
    return null;
  }
  return node.data.subgraphId ?? node.id;
}

/**
 * Resolves the subgraph id for Tab / Enter-group when exactly one node group is selected.
 * Prefers React Flow render-node `selected` (immediate UI), then store `selectedNodeIds`.
 */
export function resolveSelectedNodeGroupSubgraphId(params: {
  renderNodes: readonly FlowGraphNode[];
  storeNodes: readonly FlowGraphNode[];
  selectedNodeIds: readonly string[];
  selectedNodeId: string | null;
}): string | null {
  const renderSelected = params.renderNodes.filter(
    (n) => n.selected && isStudioNodeGroupNode(n),
  );
  if (renderSelected.length === 1) {
    return resolveNodeGroupSubgraphIdFromNode(renderSelected[0]);
  }

  const ids =
    params.selectedNodeIds.length > 0
      ? params.selectedNodeIds
      : params.selectedNodeId != null
        ? [params.selectedNodeId]
        : [];
  if (ids.length !== 1) {
    return null;
  }

  const node = params.storeNodes.find((n) => n.id === ids[0]);
  return resolveNodeGroupSubgraphIdFromNode(node);
}
