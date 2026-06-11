import {
  isDashboardGroupCatalogId,
  isDashboardWidgetCatalogId,
} from "./evaluate-dashboard-snapshot";
import {
  STUDIO_HANDLE_WIDGET,
  STUDIO_HANDLE_WIDGETS,
} from "../../features/editor/studio-handle-ids";
import type { FlowGraphNode } from "../../features/editor/store/flow-editor.store";
import type { Edge } from "@xyflow/react";

/** Expand dashboard canvas selection to flow node ids safe to delete (includes group children). */
export function resolveDashboardWidgetDeletionIds(args: {
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
  selectedSourceNodeIds: readonly string[];
}): string[] {
  const { nodes, edges, selectedSourceNodeIds } = args;
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const deleteIds = new Set<string>();

  const addGroupChildren = (groupId: string) => {
    for (const edge of edges) {
      if (edge.target !== groupId) {
        continue;
      }
      if ((edge.targetHandle ?? STUDIO_HANDLE_WIDGETS) !== STUDIO_HANDLE_WIDGETS) {
        continue;
      }
      if ((edge.sourceHandle ?? STUDIO_HANDLE_WIDGET) !== STUDIO_HANDLE_WIDGET) {
        continue;
      }
      if (typeof edge.source === "string" && edge.source.length > 0) {
        deleteIds.add(edge.source);
      }
    }
  };

  for (const sourceNodeId of selectedSourceNodeIds) {
    const node = nodeById.get(sourceNodeId);
    if (node == null) {
      continue;
    }
    const catalogId = String(node.data.nodeId ?? "");
    if (isDashboardGroupCatalogId(catalogId)) {
      deleteIds.add(sourceNodeId);
      addGroupChildren(sourceNodeId);
      continue;
    }
    if (isDashboardWidgetCatalogId(catalogId)) {
      deleteIds.add(sourceNodeId);
    }
  }

  return [...deleteIds];
}
