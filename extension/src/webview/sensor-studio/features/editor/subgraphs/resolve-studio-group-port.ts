import type { Node } from "@xyflow/react";
import type { StudioPortType } from "../flow-graph-types";
import type { StudioSubgraphDocument } from "./studio-subgraph.types";
import { isStudioNodeGroupNode } from "./studio-subgraph.types";

export function resolveStudioGroupNodePortType(
  node: Node,
  handle: string,
  direction: "input" | "output",
  subgraphs: Record<string, StudioSubgraphDocument>,
): StudioPortType | null {
  if (isStudioNodeGroupNode(node)) {
    const sub = subgraphs[node.data.subgraphId ?? node.id];
    const list = direction === "input" ? sub?.interface.inputs : sub?.interface.outputs;
    return list?.find((s) => s.id === handle)?.portType ?? null;
  }
  if (node.type === "studio-group-input" && direction === "output") {
    return node.data.interface.inputs.find((s) => s.id === handle)?.portType ?? null;
  }
  if (node.type === "studio-group-output" && direction === "input") {
    return node.data.interface.outputs.find((s) => s.id === handle)?.portType ?? null;
  }
  return null;
}

export function isStudioGroupBoundaryNodeType(type: string | undefined): boolean {
  return type === "studio-group-input" || type === "studio-group-output";
}
