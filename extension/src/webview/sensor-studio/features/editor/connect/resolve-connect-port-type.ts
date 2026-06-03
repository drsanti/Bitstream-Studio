import type { Node } from "@xyflow/react";
import type { StudioPortType } from "../flow-graph-types";
import type { StudioSubgraphDocument } from "../subgraphs/studio-subgraph.types";
import { resolveStudioGroupNodePortType } from "../subgraphs/resolve-studio-group-port";
import {
  resolveFlowSourcePortType,
  resolveFlowTargetPortType,
} from "../layout/layout-port-resolution";

/** Resolve port type for smart connect and connect-drag styling (matches FlowCanvas). */
export function resolveConnectPortType(
  node: Node,
  handleId: string,
  handleType: "source" | "target",
  subgraphs: Record<string, StudioSubgraphDocument>,
): StudioPortType | null {
  if (handleType === "source") {
    return (
      resolveStudioGroupNodePortType(node, handleId, "output", subgraphs) ??
      resolveFlowSourcePortType(node, handleId)
    );
  }
  return (
    resolveStudioGroupNodePortType(node, handleId, "input", subgraphs) ??
    resolveFlowTargetPortType(node, handleId)
  );
}
