import type { Node } from "@xyflow/react";
import type { StudioNode, StudioPortType } from "../store/flow-editor.store";
import { STUDIO_HANDLE_IN, STUDIO_HANDLE_OUT } from "../store/flow-editor.store";
import {
  isLayoutFlowNode,
  isSplitOutputHandle,
  splitOutputHandleIds,
  type LayoutFlowNode,
  type RerouteLayoutNodeData,
  type SplitLayoutNodeData,
} from "./layout-flow-nodes.types";

export function isStudioFlowNode(node: Node): node is StudioNode {
  return node.type === "studio" || node.type == null;
}

function studioSourcePortType(node: StudioNode, sourceHandle: string): StudioPortType | null {
  if (node.data.outputHandles != null && node.data.outputHandles.length > 0) {
    return node.data.outputHandles.find((h) => h.id === sourceHandle)?.portType ?? null;
  }
  if (sourceHandle === STUDIO_HANDLE_OUT && node.data.outputType != null) {
    return node.data.outputType;
  }
  return null;
}

function studioTargetPortType(
  node: StudioNode,
  targetHandle: string,
): StudioPortType | null {
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
