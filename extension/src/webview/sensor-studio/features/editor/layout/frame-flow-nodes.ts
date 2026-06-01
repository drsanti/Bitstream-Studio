import type { FlowGraphNode } from "../store/flow-editor.store";
import type { FrameLayoutNodeData } from "./layout-flow-nodes.types";

export const FRAME_FIT_PAD = 16;
export const FRAME_HEADER_H = 28;
export const FRAME_MIN_WIDTH = 200;
export const FRAME_MIN_HEIGHT = 120;
export const DEFAULT_FRAME_SIZE = { width: 280, height: 180 };

const DEFAULT_STUDIO_NODE_WIDTH = 170;
const DEFAULT_STUDIO_NODE_HEIGHT = 96;

export type FrameInsets = {
  left: number;
  right: number;
  bottom: number;
  headerHeight: number;
  contentTop: number;
};

function clampPx(value: unknown, fallback: number, min = 0, max = 128): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

export function isStudioFrameNode(node: FlowGraphNode | undefined): boolean {
  return node?.type === "studio-frame";
}

export function isStudioNoteNode(node: FlowGraphNode | undefined): boolean {
  return node?.type === "studio-note";
}

/** Canvas-only nodes that must not become frame children. */
export function isLayoutOnlyForFrame(node: FlowGraphNode): boolean {
  return isStudioFrameNode(node) || isStudioNoteNode(node);
}

export function resolveFrameInsets(data?: FrameLayoutNodeData): FrameInsets {
  const padding = clampPx(data?.padding, FRAME_FIT_PAD);
  const padX = clampPx(data?.padX ?? padding, padding);
  const padY = clampPx(data?.padY ?? padding, padding);
  const headerHeight = clampPx(data?.headerHeight, FRAME_HEADER_H, 20, 72);
  const padTop = clampPx(data?.padTop, 0, 0, 64);
  return {
    left: clampPx(data?.padLeft ?? padX, padX),
    right: clampPx(data?.padRight ?? padX, padX),
    bottom: clampPx(data?.padBottom ?? padY, padY),
    headerHeight,
    contentTop: headerHeight + padTop,
  };
}

function readStylePx(
  style: FlowGraphNode["style"],
  key: "width" | "height",
  fallback: number,
): number {
  const raw = style?.[key];
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string") {
    const n = parseFloat(raw);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return fallback;
}

function frameRect(frame: FlowGraphNode) {
  const w = frame.width ?? readStylePx(frame.style, "width", DEFAULT_FRAME_SIZE.width);
  const h = frame.height ?? readStylePx(frame.style, "height", DEFAULT_FRAME_SIZE.height);
  return {
    x: frame.position.x,
    y: frame.position.y,
    w,
    h,
  };
}

export function getFlowNodeMeasuredSize(node: FlowGraphNode): { w: number; h: number } {
  if (node.type === "studio-reroute") {
    return { w: 40, h: 22 };
  }
  if (node.type === "studio-split") {
    return {
      w: node.width ?? readStylePx(node.style, "width", 140),
      h: node.height ?? readStylePx(node.style, "height", 80),
    };
  }
  if (node.type === "studio-note") {
    return {
      w: node.width ?? readStylePx(node.style, "width", 200),
      h: node.height ?? readStylePx(node.style, "height", 80),
    };
  }
  return {
    w: node.width ?? readStylePx(node.style, "width", DEFAULT_STUDIO_NODE_WIDTH),
    h: node.height ?? readStylePx(node.style, "height", DEFAULT_STUDIO_NODE_HEIGHT),
  };
}

export function nodeAbsolutePosition(
  node: FlowGraphNode,
  nodes: FlowGraphNode[],
): { x: number; y: number } {
  if (node.parentId == null) {
    return { ...node.position };
  }
  const parent = nodes.find((n) => n.id === node.parentId);
  if (parent == null) {
    return { ...node.position };
  }
  const p = nodeAbsolutePosition(parent, nodes);
  return { x: p.x + node.position.x, y: p.y + node.position.y };
}

export function nodeIntersectsFrame(
  node: FlowGraphNode,
  frame: FlowGraphNode,
  nodes: FlowGraphNode[],
): boolean {
  const abs = nodeAbsolutePosition(node, nodes);
  const { w, h } = getFlowNodeMeasuredSize(node);
  const r = frameRect(frame);
  return (
    abs.x < r.x + r.w &&
    abs.x + w > r.x &&
    abs.y < r.y + r.h &&
    abs.y + h > r.y
  );
}

export function canBeFrameChild(node: FlowGraphNode): boolean {
  return !isLayoutOnlyForFrame(node);
}

export function attachNodeToFrame(
  node: FlowGraphNode,
  frame: FlowGraphNode,
  nodes: FlowGraphNode[],
): FlowGraphNode {
  const abs = nodeAbsolutePosition(node, nodes);
  const inset = resolveFrameInsets(frame.data as FrameLayoutNodeData);
  return {
    ...node,
    parentId: frame.id,
    extent: "parent",
    position: {
      x: Math.max(inset.left, abs.x - frame.position.x),
      y: Math.max(inset.contentTop, abs.y - frame.position.y),
    },
  };
}

export function detachNodeFromFrame(node: FlowGraphNode, nodes: FlowGraphNode[]): FlowGraphNode {
  const abs = nodeAbsolutePosition(node, nodes);
  const next: FlowGraphNode = { ...node, position: abs };
  delete next.parentId;
  delete next.extent;
  return next;
}

export function sortFlowNodesParentFirst(nodes: FlowGraphNode[]): FlowGraphNode[] {
  const frames = nodes.filter((n) => isStudioFrameNode(n));
  const rest = nodes.filter((n) => !isStudioFrameNode(n));
  return [...frames, ...rest];
}

export function frameAutoFitEnabled(frame: FlowGraphNode): boolean {
  return Boolean((frame.data as FrameLayoutNodeData | undefined)?.autoFit);
}

export function syncFrameChildren(
  frame: FlowGraphNode,
  nodes: FlowGraphNode[],
): { nodes: FlowGraphNode[]; changed: boolean } {
  const frameNode = nodes.find((n) => n.id === frame.id) ?? frame;
  let next = nodes;
  let changed = false;

  for (const child of next.filter((n) => n.parentId === frameNode.id)) {
    if (!nodeIntersectsFrame(child, frameNode, next)) {
      next = next.map((n) => (n.id === child.id ? detachNodeFromFrame(child, next) : n));
      changed = true;
    }
  }

  for (const node of next) {
    if (!canBeFrameChild(node) || node.id === frameNode.id) {
      continue;
    }
    if (!nodeIntersectsFrame(node, frameNode, next)) {
      continue;
    }
    if (node.parentId === frameNode.id) {
      continue;
    }

    let candidate = node;
    if (node.parentId != null) {
      const parent = next.find((p) => p.id === node.parentId);
      if (parent != null && isStudioFrameNode(parent)) {
        candidate = detachNodeFromFrame(node, next);
        next = next.map((n) => (n.id === node.id ? candidate : n));
      }
    }

    const attached = attachNodeToFrame(candidate, frameNode, next);
    next = next.map((n) => (n.id === candidate.id ? attached : n));
    changed = true;
  }

  return {
    nodes: changed ? sortFlowNodesParentFirst(next) : next,
    changed,
  };
}

export function fitFrameToContents(
  frame: FlowGraphNode,
  nodes: FlowGraphNode[],
): { nodes: FlowGraphNode[]; fitted: boolean } {
  const frameNode = nodes.find((n) => n.id === frame.id) ?? frame;
  const children = nodes.filter((n) => n.parentId === frameNode.id);
  if (children.length === 0) {
    return { nodes, fitted: false };
  }

  const inset = resolveFrameInsets(frameNode.data as FrameLayoutNodeData);
  let minAbsX = Infinity;
  let minAbsY = Infinity;
  let maxAbsX = -Infinity;
  let maxAbsY = -Infinity;

  for (const child of children) {
    const abs = nodeAbsolutePosition(child, nodes);
    const { w, h } = getFlowNodeMeasuredSize(child);
    minAbsX = Math.min(minAbsX, abs.x);
    minAbsY = Math.min(minAbsY, abs.y);
    maxAbsX = Math.max(maxAbsX, abs.x + w);
    maxAbsY = Math.max(maxAbsY, abs.y + h);
  }

  const newFramePos = {
    x: minAbsX - inset.left,
    y: minAbsY - inset.contentTop,
  };
  const newWidth = Math.max(FRAME_MIN_WIDTH, maxAbsX - minAbsX + inset.left + inset.right);
  const newHeight = Math.max(
    FRAME_MIN_HEIGHT,
    maxAbsY - minAbsY + inset.contentTop + inset.bottom,
  );

  const childRel = new Map<string, { x: number; y: number }>();
  for (const child of children) {
    const abs = nodeAbsolutePosition(child, nodes);
    childRel.set(child.id, {
      x: abs.x - newFramePos.x,
      y: abs.y - newFramePos.y,
    });
  }

  const next = nodes.map((n) => {
    if (n.id === frameNode.id) {
      return {
        ...n,
        position: newFramePos,
        style: { ...n.style, width: newWidth, height: newHeight },
        width: newWidth,
        height: newHeight,
      };
    }
    const rel = childRel.get(n.id);
    if (rel != null) {
      return { ...n, position: rel };
    }
    return n;
  });

  return { nodes: next, fitted: true };
}

export function syncFrameChildrenWithAutoFit(
  frame: FlowGraphNode,
  nodes: FlowGraphNode[],
): { nodes: FlowGraphNode[]; changed: boolean } {
  const synced = syncFrameChildren(frame, nodes);
  let next = synced.nodes;
  let changed = synced.changed;
  const frameNode = next.find((n) => n.id === frame.id) ?? frame;
  if (frameAutoFitEnabled(frameNode)) {
    const fitted = fitFrameToContents(frameNode, next);
    next = fitted.nodes;
    changed = changed || fitted.fitted;
  }
  if (!changed) {
    return { nodes: next, changed: false };
  }
  return { nodes: sortFlowNodesParentFirst(next), changed: true };
}

export function fitParentFrameIfAutoFit(
  node: FlowGraphNode,
  nodes: FlowGraphNode[],
): { nodes: FlowGraphNode[]; changed: boolean } {
  if (node.parentId == null) {
    return { nodes, changed: false };
  }
  const parent = nodes.find((n) => n.id === node.parentId);
  if (parent == null || !isStudioFrameNode(parent) || !frameAutoFitEnabled(parent)) {
    return { nodes, changed: false };
  }
  const fitted = fitFrameToContents(parent, nodes);
  if (!fitted.fitted) {
    return { nodes, changed: false };
  }
  return { nodes: sortFlowNodesParentFirst(fitted.nodes), changed: true };
}

export function fitFramesToContents(
  frameIds: string[],
  nodes: FlowGraphNode[],
): { nodes: FlowGraphNode[]; changed: boolean } {
  if (frameIds.length === 0) {
    return { nodes, changed: false };
  }
  let next = nodes;
  let changed = false;
  for (const frameId of frameIds) {
    const frame = next.find((n) => n.id === frameId);
    if (frame == null || !isStudioFrameNode(frame)) {
      continue;
    }
    const fitted = fitFrameToContents(frame, next);
    next = fitted.nodes;
    changed = changed || fitted.fitted;
  }
  if (!changed) {
    return { nodes: next, changed: false };
  }
  return { nodes: sortFlowNodesParentFirst(next), changed: true };
}

/** Remove layout frame(s) and keep children at their current canvas positions. */
export function dissolveStudioFrames(
  frameIds: string[],
  nodes: FlowGraphNode[],
): { nodes: FlowGraphNode[]; changed: boolean } {
  const frameIdSet = new Set(frameIds);
  if (frameIdSet.size === 0) {
    return { nodes, changed: false };
  }

  let next = nodes;
  let changed = false;

  for (const child of next.filter((n) => n.parentId != null && frameIdSet.has(n.parentId))) {
    next = next.map((n) => (n.id === child.id ? detachNodeFromFrame(child, next) : n));
    changed = true;
  }

  const withoutFrames = next.filter((n) => !frameIdSet.has(n.id));
  if (withoutFrames.length !== next.length) {
    changed = true;
  }

  return {
    nodes: changed ? sortFlowNodesParentFirst(withoutFrames) : nodes,
    changed,
  };
}

/** Apply frame membership updates after a node drag ends. */
export function applyFlowFrameDragStop(
  dragged: FlowGraphNode,
  nodes: FlowGraphNode[],
): { nodes: FlowGraphNode[]; changed: boolean } {
  let next = nodes.map((n) => (n.id === dragged.id ? dragged : n));
  let changed = false;

  if (isStudioFrameNode(dragged)) {
    const synced = syncFrameChildrenWithAutoFit(dragged, next);
    return { nodes: synced.nodes, changed: synced.changed };
  }

  const frames = next.filter((n) => isStudioFrameNode(n));
  let targetFrame: FlowGraphNode | undefined;
  for (const frame of frames) {
    if (frame.id === dragged.parentId) {
      continue;
    }
    if (nodeIntersectsFrame(dragged, frame, next)) {
      targetFrame = frame;
      break;
    }
  }

  if (targetFrame != null && dragged.parentId !== targetFrame.id) {
    const attached = attachNodeToFrame(dragged, targetFrame, next);
    next = sortFlowNodesParentFirst(next.map((n) => (n.id === dragged.id ? attached : n)));
    changed = true;
  } else if (targetFrame == null && dragged.parentId != null) {
    const parent = next.find((n) => n.id === dragged.parentId);
    if (parent != null && isStudioFrameNode(parent)) {
      const detached = detachNodeFromFrame(dragged, next);
      next = next.map((n) => (n.id === dragged.id ? detached : n));
      changed = true;
    }
  }

  const draggedNode = next.find((n) => n.id === dragged.id) ?? dragged;
  const parentFit = fitParentFrameIfAutoFit(draggedNode, next);
  if (parentFit.changed) {
    next = parentFit.nodes;
    changed = true;
  }

  return { nodes: next, changed };
}

/** Wrap selected top-level nodes in a new frame (node-animator parity). */
export function createFrameAroundNodes(
  contentNodes: FlowGraphNode[],
): { frame: FlowGraphNode; children: FlowGraphNode[] } {
  if (contentNodes.length === 0) {
    const frame = buildFrameAroundEmpty();
    return { frame, children: [] };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of contentNodes) {
    const abs = nodeAbsolutePosition(n, contentNodes);
    const { w, h } = getFlowNodeMeasuredSize(n);
    minX = Math.min(minX, abs.x);
    minY = Math.min(minY, abs.y);
    maxX = Math.max(maxX, abs.x + w);
    maxY = Math.max(maxY, abs.y + h);
  }

  const frame = buildFrameAroundEmpty();
  const inset = resolveFrameInsets(frame.data as FrameLayoutNodeData);
  const framePos = { x: minX - inset.left, y: minY - inset.contentTop };
  const frameWidth = Math.max(FRAME_MIN_WIDTH, maxX - minX + inset.left + inset.right);
  const frameHeight = Math.max(
    FRAME_MIN_HEIGHT,
    maxY - minY + inset.contentTop + inset.bottom,
  );
  const frameNode: FlowGraphNode = {
    ...frame,
    position: framePos,
    style: { ...frame.style, width: frameWidth, height: frameHeight },
    width: frameWidth,
    height: frameHeight,
  };

  const children = contentNodes.map((n) => attachNodeToFrame(n, frameNode, contentNodes));
  return { frame: frameNode, children };
}

function buildFrameAroundEmpty(): FlowGraphNode {
  const id = `frame_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    type: "studio-frame",
    position: { x: 0, y: 0 },
    data: {
      label: "Frame",
      padding: FRAME_FIT_PAD,
      headerHeight: FRAME_HEADER_H,
      padTop: 4,
    },
    dragHandle: ".studio-frame-node__drag",
    selectable: true,
    draggable: true,
    zIndex: -1,
    style: {
      width: DEFAULT_FRAME_SIZE.width,
      height: DEFAULT_FRAME_SIZE.height,
    },
  };
}

/** Detach selected nodes from their parent frame (if any). */
export function detachNodesFromFrame(
  nodeIds: readonly string[],
  nodes: FlowGraphNode[],
): { nodes: FlowGraphNode[]; changed: boolean } {
  const idSet = new Set(nodeIds);
  let next = nodes;
  let changed = false;
  for (const id of nodeIds) {
    if (!idSet.has(id)) {
      continue;
    }
    const node = next.find((n) => n.id === id);
    if (node?.parentId == null) {
      continue;
    }
    const parent = next.find((p) => p.id === node.parentId);
    if (parent == null || !isStudioFrameNode(parent)) {
      continue;
    }
    next = next.map((n) => (n.id === id ? detachNodeFromFrame(node, next) : n));
    changed = true;
  }
  return { nodes: changed ? next : nodes, changed };
}
