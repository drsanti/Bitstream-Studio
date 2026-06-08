import type { Node } from "@xyflow/react";

/** Header strip — drag to move; matches other layout nodes (`node-drag-handle`). */
export const STUDIO_GROUP_BOUNDARY_NODE_DRAG_HANDLE = ".studio-group-boundary__header";

/** Keep Group Input/Output above inner nodes so headers stay clickable. */
export const STUDIO_GROUP_BOUNDARY_NODE_Z_INDEX = 100;

export function isStudioGroupBoundaryFlowNodeType(
  type: string | undefined,
): type is "studio-group-input" | "studio-group-output" {
  return type === "studio-group-input" || type === "studio-group-output";
}

export function applyStudioGroupBoundaryNodeChrome<T extends Node>(node: T): T {
  if (!isStudioGroupBoundaryFlowNodeType(node.type)) {
    return node;
  }
  const zIndex = node.zIndex ?? STUDIO_GROUP_BOUNDARY_NODE_Z_INDEX;
  const dragHandle = node.dragHandle ?? STUDIO_GROUP_BOUNDARY_NODE_DRAG_HANDLE;
  if (
    node.selectable === true &&
    node.draggable === true &&
    node.zIndex === zIndex &&
    node.dragHandle === dragHandle
  ) {
    return node;
  }
  return {
    ...node,
    selectable: true,
    draggable: true,
    zIndex,
    dragHandle,
  };
}
