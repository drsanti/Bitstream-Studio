import type { Edge, Node } from "@xyflow/react";
import type { StudioPortType } from "../store/flow-editor.store";
import {
  createGroupSocketId,
  findGroupBoundaryNode,
  type StudioGraphId,
  type StudioGroupInterface,
  type StudioGroupSocketDef,
  type StudioSubgraphDocument,
} from "./studio-subgraph.types";

export const STUDIO_GROUP_SOCKET_PORT_TYPES: StudioPortType[] = [
  "number",
  "boolean",
  "string",
  "event",
  "vector3",
  "quaternion",
  "environment",
  "camera",
  "glbAnimation",
  "transform",
];

/** Prefer live graph when editing the subgraph currently open in the flow editor. */
export function subgraphForInterfaceEdit(
  subgraphId: StudioGraphId,
  subgraph: StudioSubgraphDocument | undefined,
  activeGraphId: StudioGraphId,
  liveNodes: Node[],
  liveEdges: Edge[],
): StudioSubgraphDocument | null {
  if (subgraph == null) {
    return null;
  }
  if (activeGraphId !== subgraphId) {
    return subgraph;
  }
  return { ...subgraph, nodes: liveNodes, edges: liveEdges };
}

/** Sync Group Input/Output node data and drop edges on removed sockets. */
export function applyGroupInterfaceToSubgraph(
  sub: StudioSubgraphDocument,
  iface: StudioGroupInterface,
): StudioSubgraphDocument {
  const inputNode = findGroupBoundaryNode(sub.nodes, "input");
  const outputNode = findGroupBoundaryNode(sub.nodes, "output");
  const inputHandles = new Set(iface.inputs.map((s) => s.id));
  const outputHandles = new Set(iface.outputs.map((s) => s.id));

  const nodes = sub.nodes.map((n) => {
    if (n.type === "studio-group-input" || n.type === "studio-group-output") {
      return { ...n, data: { ...n.data, interface: iface } };
    }
    return n;
  });

  const edges = sub.edges.filter((e) => {
    if (inputNode != null && e.source === inputNode.id) {
      return e.sourceHandle == null || inputHandles.has(e.sourceHandle);
    }
    if (outputNode != null && e.target === outputNode.id) {
      return e.targetHandle == null || outputHandles.has(e.targetHandle);
    }
    return true;
  });

  return { ...sub, nodes, edges, interface: iface };
}

/** Drop parent-graph wires that referenced removed group shell handles. */
export function filterParentEdgesForGroupInterface(
  edges: Edge[],
  hostNodeId: string,
  iface: StudioGroupInterface,
): Edge[] {
  const inputHandles = new Set(iface.inputs.map((s) => s.id));
  const outputHandles = new Set(iface.outputs.map((s) => s.id));
  return edges.filter((e) => {
    if (e.target === hostNodeId && e.targetHandle != null) {
      return inputHandles.has(e.targetHandle);
    }
    if (e.source === hostNodeId && e.sourceHandle != null) {
      return outputHandles.has(e.sourceHandle);
    }
    return true;
  });
}

export function createManualGroupSocket(
  direction: "input" | "output",
  overrides?: Partial<Pick<StudioGroupSocketDef, "label" | "portType">>,
): StudioGroupSocketDef {
  const label = overrides?.label ?? (direction === "input" ? "Input" : "Output");
  const portType = overrides?.portType ?? "number";
  const id = createGroupSocketId();
  return {
    id,
    label,
    portType,
    direction,
    boundaryKey: `manual:${direction}:${portType}:${label}:${id}`,
  };
}
