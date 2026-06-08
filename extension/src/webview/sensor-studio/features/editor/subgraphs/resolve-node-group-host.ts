import type { FlowGraphNode } from "../store/flow-editor.store";
import { findStudioNodeGroupHostBySubgraphId } from "./node-library/find-studio-node-group-host";
import {
  isStudioGroupBoundaryNode,
  isStudioNodeGroupNode,
  STUDIO_ROOT_GRAPH_ID,
  type StudioNodeGroupData,
  type StudioSubgraphDocument,
} from "./studio-subgraph.types";

/** Resolve the host group node id from a group shell or boundary selection. */
export function resolveNodeGroupHostId(
  selectedNode: { id: string; type?: string; data?: unknown },
  rootNodes: readonly FlowGraphNode[],
  activeGraphId: string,
  subgraphs: Record<string, StudioSubgraphDocument>,
): { hostNodeId: string; data: StudioNodeGroupData; focusedBoundaryRole: "input" | "output" | null } | null {
  if (isStudioNodeGroupNode(selectedNode as Parameters<typeof isStudioNodeGroupNode>[0])) {
    return {
      hostNodeId: selectedNode.id,
      data: selectedNode.data as StudioNodeGroupData,
      focusedBoundaryRole: null,
    };
  }
  if (
    isStudioGroupBoundaryNode(selectedNode as Parameters<typeof isStudioGroupBoundaryNode>[0]) &&
    activeGraphId !== STUDIO_ROOT_GRAPH_ID
  ) {
    const host = findStudioNodeGroupHostBySubgraphId(activeGraphId, rootNodes, subgraphs);
    if (host == null) {
      return null;
    }
    const role =
      selectedNode.type === "studio-group-input"
        ? ("input" as const)
        : selectedNode.type === "studio-group-output"
          ? ("output" as const)
          : null;
    return {
      hostNodeId: host.id,
      data: host.data,
      focusedBoundaryRole: role,
    };
  }
  return null;
}
