export const EMPTY_SCENE_NODE_SELECTION: string[] = [];

/** @deprecated Use activeNodeId from store; kept for single-select fallbacks. */
export function primarySceneSelection(selectedNodeIds: readonly string[]): string | null {
  return selectedNodeIds[selectedNodeIds.length - 1] ?? null;
}

export function resolveSceneActiveNodeId(
  activeNodeId: string | null | undefined,
  selectedNodeIds?: readonly string[],
): string | null {
  if (activeNodeId != null) {
    return activeNodeId;
  }
  return primarySceneSelection(selectedNodeIds ?? EMPTY_SCENE_NODE_SELECTION);
}

export function resolveSceneSelectionIds(
  selectedNodeIds?: readonly string[],
  selectedNodeId?: string | null,
): string[] {
  if (selectedNodeIds != null && selectedNodeIds.length > 0) {
    return [...selectedNodeIds];
  }
  if (selectedNodeId != null) {
    return [selectedNodeId];
  }
  return [];
}

export function isDiagram3dGizmoTarget(nodeId: string, activeNodeId: string | null | undefined): boolean {
  return activeNodeId === nodeId;
}

export function isSceneNodeSelected(
  selectedNodeIds: readonly string[],
  nodeId: string,
): boolean {
  return selectedNodeIds.includes(nodeId);
}

export function isSceneNodeActive(nodeId: string, activeNodeId: string | null | undefined): boolean {
  return activeNodeId === nodeId;
}

/** Blender-style pick: plain click on selected keeps multi-select but changes active. */
export function pickSceneNodeSelection(
  selectedNodeIds: readonly string[],
  nodeId: string,
  extend: boolean,
): { selected: string[]; active: string } {
  if (!extend) {
    if (selectedNodeIds.includes(nodeId)) {
      return { selected: [...selectedNodeIds], active: nodeId };
    }
    return { selected: [nodeId], active: nodeId };
  }
  if (selectedNodeIds.includes(nodeId)) {
    return { selected: [...selectedNodeIds], active: nodeId };
  }
  return { selected: [...selectedNodeIds, nodeId], active: nodeId };
}

/** @deprecated Use pickSceneNodeSelection */
export function toggleSceneNodeSelection(
  selectedNodeIds: readonly string[],
  nodeId: string,
  extend: boolean,
): string[] {
  return pickSceneNodeSelection(selectedNodeIds, nodeId, extend).selected;
}
