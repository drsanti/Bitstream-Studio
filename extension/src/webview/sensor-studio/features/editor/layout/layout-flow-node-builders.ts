import type { XYPosition } from "@xyflow/react";
import type { StudioPortType } from "../store/flow-editor.store";
import {
  REROUTE_LAYOUT_HEIGHT,
  REROUTE_LAYOUT_WIDTH,
  type FrameFlowNode,
  type LayoutMenuEntryId,
  type NoteFlowNode,
  type RerouteFlowNode,
  type SplitFlowNode,
} from "./layout-flow-nodes.types";

function layoutNodeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function centerPosition(
  position: XYPosition,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: position.x - width / 2,
    y: position.y - height / 2,
  };
}

export function buildRerouteFlowNode(
  position: XYPosition,
  socketType?: StudioPortType,
): RerouteFlowNode {
  return {
    id: layoutNodeId("reroute"),
    type: "studio-reroute",
    position: centerPosition(position, REROUTE_LAYOUT_WIDTH, REROUTE_LAYOUT_HEIGHT),
    data: socketType != null ? { socketType } : {},
    selectable: true,
    draggable: true,
  };
}

export function buildFrameFlowNode(position: XYPosition): FrameFlowNode {
  return {
    id: layoutNodeId("frame"),
    type: "studio-frame",
    position: {
      x: position.x - 120,
      y: position.y - 80,
    },
    data: { label: "Frame" },
    selectable: true,
    draggable: true,
    zIndex: -1,
    style: { width: 280, height: 180 },
  };
}

export function buildNoteFlowNode(position: XYPosition): NoteFlowNode {
  return {
    id: layoutNodeId("note"),
    type: "studio-note",
    position: centerPosition(position, 200, 80),
    data: { label: "Note", text: "" },
    selectable: true,
    draggable: true,
    zIndex: 1,
  };
}

export function buildSplitFlowNode(
  position: XYPosition,
  socketType?: StudioPortType,
): SplitFlowNode {
  return {
    id: layoutNodeId("split"),
    type: "studio-split",
    position: {
      x: position.x - 70,
      y: position.y - 40,
    },
    data: {
      outputCount: 4,
      ...(socketType != null ? { socketType } : {}),
    },
    selectable: true,
    draggable: true,
  };
}

export function buildLayoutFlowNode(
  kind: LayoutMenuEntryId,
  position: XYPosition,
): RerouteFlowNode | FrameFlowNode | NoteFlowNode | SplitFlowNode {
  switch (kind) {
    case "reroute":
      return buildRerouteFlowNode(position);
    case "frame":
      return buildFrameFlowNode(position);
    case "note":
      return buildNoteFlowNode(position);
    case "split":
      return buildSplitFlowNode(position);
  }
}
