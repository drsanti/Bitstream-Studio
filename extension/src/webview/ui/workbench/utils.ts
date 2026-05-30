import { v4 as uuidv4 } from "uuid";
import type { LayoutNode } from "./types";

export function updateNodeRatio(node: LayoutNode, targetId: string, ratio: number): LayoutNode {
  if (node.id === targetId && node.type === "split") {
    return { ...node, ratio: Math.max(0.05, Math.min(0.95, ratio)) };
  }
  if (node.type === "split") {
    return {
      ...node,
      first: updateNodeRatio(node.first, targetId, ratio),
      second: updateNodeRatio(node.second, targetId, ratio),
    };
  }
  return node;
}

export function splitNode(
  node: LayoutNode,
  targetId: string,
  direction: "horizontal" | "vertical",
): LayoutNode {
  if (node.id === targetId && node.type === "editor") {
    return {
      id: uuidv4(),
      type: "split",
      direction,
      ratio: 0.5,
      first: { ...node },
      second: { id: uuidv4(), type: "editor", editorType: node.editorType },
    };
  }
  if (node.type === "split") {
    return {
      ...node,
      first: splitNode(node.first, targetId, direction),
      second: splitNode(node.second, targetId, direction),
    };
  }
  return node;
}

export function closeNode(node: LayoutNode, targetId: string): LayoutNode {
  if (node.type === "split") {
    if (node.first.id === targetId) {
      return node.second;
    }
    if (node.second.id === targetId) {
      return node.first;
    }
    return {
      ...node,
      first: closeNode(node.first, targetId),
      second: closeNode(node.second, targetId),
    };
  }
  return node;
}

export function changeNodeType(node: LayoutNode, targetId: string, editorType: string): LayoutNode {
  if (node.id === targetId && node.type === "editor") {
    return { ...node, editorType };
  }
  if (node.type === "split") {
    return {
      ...node,
      first: changeNodeType(node.first, targetId, editorType),
      second: changeNodeType(node.second, targetId, editorType),
    };
  }
  return node;
}
