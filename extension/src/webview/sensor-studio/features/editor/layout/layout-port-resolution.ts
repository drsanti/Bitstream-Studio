import type { Edge, Node } from "@xyflow/react";
import type { StudioPortType } from "../flow-graph-types";
import { STUDIO_HANDLE_IN, STUDIO_HANDLE_OUT } from "../studio-handle-ids";
import {
  isLayoutFlowNode,
  isSplitOutputHandle,
  splitOutputHandleIds,
  type LayoutFlowNode,
  type RerouteLayoutNodeData,
  type SplitLayoutNodeData,
} from "./layout-flow-nodes.types";

export function isStudioFlowNode(node: Node | null | undefined): boolean {
  if (node == null) {
    return false;
  }
  return node.type === "studio" || node.type == null;
}

const STUDIO_PORT_TYPES: readonly StudioPortType[] = [
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
  "fog",
  "studioLight",
  "postProcessing",
  "contactShadows",
  "particleEmitter",
  "audioBus",
  "videoBus",
  "videoTexture",
  "physicsScene",
  "physicsCollider",
  "physicsBody",
  "dashboardWidget",
  "dashboardTheme",
  "dashboardTab",
  "material",
  "mesh",
];

function portTypeFromEdgeLabel(label: unknown): StudioPortType | null {
  if (typeof label !== "string" || label.length === 0) {
    return null;
  }
  return STUDIO_PORT_TYPES.includes(label as StudioPortType)
    ? (label as StudioPortType)
    : null;
}

type FlowWireRef = Pick<
  Edge,
  "source" | "target" | "sourceHandle" | "targetHandle" | "label"
>;

/**
 * When a reroute/split has no locked `socketType`, infer the wire type from
 * upstream/downstream edges so smart connect can filter and auto-wire.
 */
export function inferLayoutNodeSmartConnectPortType(
  node: Node,
  handleId: string,
  handleType: "source" | "target",
  edges: readonly FlowWireRef[],
  nodes: readonly Node[],
): StudioPortType | null {
  if (!isLayoutFlowNode(node)) {
    return null;
  }
  if (node.type !== "studio-reroute" && node.type !== "studio-split") {
    return null;
  }
  const data = node.data as RerouteLayoutNodeData | SplitLayoutNodeData;
  if (data.socketType != null) {
    return data.socketType;
  }

  const findNode = (id: string) => nodes.find((n) => n.id === id);

  const typeFromUpstreamIn = (): StudioPortType | null => {
    const inEdge = edges.find(
      (e) => e.target === node.id && (e.targetHandle ?? "in") === "in",
    );
    if (inEdge == null) {
      return null;
    }
    const up = findNode(inEdge.source);
    if (up != null) {
      const t = resolveFlowSourcePortType(
        up,
        inEdge.sourceHandle ?? STUDIO_HANDLE_OUT,
      );
      if (t != null) {
        return t;
      }
    }
    return portTypeFromEdgeLabel(inEdge.label);
  };

  const typeFromDownstreamOut = (): StudioPortType | null => {
    const outEdge = edges.find((e) => {
      if (e.source !== node.id) {
        return false;
      }
      if (node.type === "studio-reroute") {
        return (e.sourceHandle ?? "out") === "out";
      }
      return isSplitOutputHandle(e.sourceHandle ?? "");
    });
    if (outEdge == null) {
      return null;
    }
    const down = findNode(outEdge.target);
    if (down != null) {
      const t = resolveFlowTargetPortType(
        down,
        outEdge.targetHandle ?? STUDIO_HANDLE_IN,
      );
      if (t != null) {
        return t;
      }
    }
    return portTypeFromEdgeLabel(outEdge.label);
  };

  if (handleType === "target" && handleId === "in") {
    return typeFromUpstreamIn() ?? typeFromDownstreamOut();
  }

  if (handleType === "source") {
    if (node.type === "studio-reroute" && handleId !== "out") {
      return null;
    }
    if (node.type === "studio-split" && !isSplitOutputHandle(handleId)) {
      return null;
    }
    return typeFromUpstreamIn() ?? typeFromDownstreamOut();
  }

  return null;
}

function studioSourcePortType(node: Node, sourceHandle: string): StudioPortType | null {
  if (node.data.outputHandles != null && node.data.outputHandles.length > 0) {
    return node.data.outputHandles.find((h) => h.id === sourceHandle)?.portType ?? null;
  }
  if (sourceHandle === STUDIO_HANDLE_OUT && node.data.outputType != null) {
    return node.data.outputType;
  }
  return null;
}

function studioTargetPortType(node: Node, targetHandle: string): StudioPortType | null {
  if (node.data.inputHandles != null && node.data.inputHandles.length > 0) {
    return (
      node.data.inputHandles.find((h) => h.id === targetHandle)?.portType ?? null
    );
  }
  if (targetHandle === STUDIO_HANDLE_IN && node.data.inputType != null) {
    return node.data.inputType;
  }
  return null;
}

export function resolveFlowTargetPortType(
  node: Node,
  targetHandle: string,
): StudioPortType | null {
  if (isStudioFlowNode(node)) {
    return studioTargetPortType(node, targetHandle);
  }
  if (!isLayoutFlowNode(node)) {
    return null;
  }
  if (node.type === "studio-reroute") {
    const data = node.data as RerouteLayoutNodeData;
    if (targetHandle !== "in") {
      return null;
    }
    return data.socketType ?? null;
  }
  if (node.type === "studio-split") {
    if (targetHandle !== "in") {
      return null;
    }
    const data = node.data as SplitLayoutNodeData;
    return data.socketType ?? null;
  }
  return null;
}

export function resolveFlowSourcePortType(
  node: Node,
  sourceHandle: string,
): StudioPortType | null {
  if (isStudioFlowNode(node)) {
    return studioSourcePortType(node, sourceHandle);
  }
  if (!isLayoutFlowNode(node)) {
    return null;
  }
  if (node.type === "studio-reroute") {
    const data = node.data as RerouteLayoutNodeData;
    return data.socketType ?? null;
  }
  if (node.type === "studio-split") {
    const data = node.data as SplitLayoutNodeData;
    if (!isSplitOutputHandle(sourceHandle)) {
      return null;
    }
    return data.socketType ?? null;
  }
  return null;
}

export function layoutNodeAcceptsInput(
  node: LayoutFlowNode,
  targetHandle: string,
  sourceType: StudioPortType,
): boolean {
  if (node.type === "studio-reroute") {
    if (targetHandle !== "in") {
      return false;
    }
    const locked = node.data.socketType;
    return locked == null || locked === sourceType;
  }
  if (node.type === "studio-split") {
    if (targetHandle !== "in") {
      return false;
    }
    const locked = node.data.socketType;
    return locked == null || locked === sourceType;
  }
  return false;
}

export function layoutNodeSourceHandles(node: LayoutFlowNode): string[] {
  if (node.type === "studio-reroute") {
    return ["out"];
  }
  if (node.type === "studio-split") {
    return splitOutputHandleIds(node.data.outputCount);
  }
  return [];
}

export function patchLayoutNodesAfterConnect(
  nodes: Node[],
  connection: {
    source: string;
    sourceHandle?: string | null;
    target: string;
    targetHandle?: string | null;
  },
): Node[] {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);
  if (sourceNode == null || targetNode == null) {
    return nodes;
  }
  const sourceHandle = connection.sourceHandle ?? STUDIO_HANDLE_OUT;
  const sourceType = resolveFlowSourcePortType(sourceNode, sourceHandle);
  if (sourceType == null) {
    return nodes;
  }
  const targetHandle = connection.targetHandle ?? "in";
  if (!isLayoutFlowNode(targetNode)) {
    return nodes;
  }
  if (targetNode.type === "studio-reroute" && targetHandle === "in") {
    return nodes.map((n) =>
      n.id === targetNode.id
        ? {
            ...n,
            data: { ...(n.data as RerouteLayoutNodeData), socketType: sourceType },
          }
        : n,
    );
  }
  if (targetNode.type === "studio-split" && targetHandle === "in") {
    return nodes.map((n) =>
      n.id === targetNode.id
        ? {
            ...n,
            data: { ...(n.data as SplitLayoutNodeData), socketType: sourceType },
          }
        : n,
    );
  }
  return nodes;
}
