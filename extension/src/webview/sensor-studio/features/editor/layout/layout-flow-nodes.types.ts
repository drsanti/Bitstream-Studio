import type { Node } from "@xyflow/react";
import type { StudioPortType } from "../store/flow-editor.store";

export const FLOW_LAYOUT_NODE_TYPES = [
  "studio-reroute",
  "studio-frame",
  "studio-note",
  "studio-split",
] as const;

export type FlowLayoutNodeType = (typeof FLOW_LAYOUT_NODE_TYPES)[number];

export type LayoutMenuEntryId = "reroute" | "frame" | "note" | "split";

export type RerouteLayoutNodeData = {
  socketType?: StudioPortType;
};

export type FrameLayoutNodeData = {
  label?: string;
};

export type NoteLayoutNodeData = {
  label?: string;
  text?: string;
};

export type SplitLayoutNodeData = {
  socketType?: StudioPortType;
  outputCount?: number;
};

export type RerouteFlowNode = Node<RerouteLayoutNodeData, "studio-reroute">;
export type FrameFlowNode = Node<FrameLayoutNodeData, "studio-frame">;
export type NoteFlowNode = Node<NoteLayoutNodeData, "studio-note">;
export type SplitFlowNode = Node<SplitLayoutNodeData, "studio-split">;

export type LayoutFlowNode = RerouteFlowNode | FrameFlowNode | NoteFlowNode | SplitFlowNode;

export const REROUTE_LAYOUT_WIDTH = 40;
export const REROUTE_LAYOUT_HEIGHT = 22;

export const SPLIT_OUTPUT_COUNT_MIN = 2;
export const SPLIT_OUTPUT_COUNT_MAX = 8;
export const SPLIT_OUTPUT_COUNT_DEFAULT = 4;

export function clampSplitOutputCount(value: unknown): number {
  const n =
    typeof value === "number" && Number.isFinite(value)
      ? Math.round(value)
      : SPLIT_OUTPUT_COUNT_DEFAULT;
  return Math.min(SPLIT_OUTPUT_COUNT_MAX, Math.max(SPLIT_OUTPUT_COUNT_MIN, n));
}

export function splitOutputHandleId(index: number): string {
  return `out${index}`;
}

export function splitOutputHandleIds(count: number): string[] {
  const n = clampSplitOutputCount(count);
  return Array.from({ length: n }, (_, i) => splitOutputHandleId(i));
}

export function isSplitOutputHandle(handleId: string): boolean {
  return /^out\d+$/.test(handleId);
}

export function isFlowLayoutNodeType(type: string | undefined): type is FlowLayoutNodeType {
  return type != null && (FLOW_LAYOUT_NODE_TYPES as readonly string[]).includes(type);
}

export function isLayoutFlowNode(node: Node): node is LayoutFlowNode {
  return isFlowLayoutNodeType(node.type);
}
