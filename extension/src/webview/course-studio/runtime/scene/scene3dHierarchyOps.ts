import type { Diagram3dNodeV1, DiagramV1 } from "../../schemas/diagram.v1";
import type { SceneV1 } from "../../schemas/scene.v1";
import {
  createDefaultDiagram3dGroupNode,
  findDiagram3dNode,
  findDiagram3dNodeParentId,
  group3dContainsNodeId,
  listDiagram3dGroupIds,
  moveDiagram3dNodeToParent,
  wrapDiagram3dModelInGroup,
} from "../diagram/diagram3dNodeMutations";
import {
  clearDiagram3dNodeParentInverse,
  moveDiagram3dNodeToParentKeepTransform,
} from "../diagram/diagram3dHierarchyTransform";
import {
  addScene3dNode,
  mergeDiagram3dIntoScene,
  moveScene3dNode,
  sceneV1ToDiagramV1,
} from "./sceneDiagramBridge";

function nextGroupId(): string {
  return `group-${Date.now().toString(36)}`;
}

export type Scene3dParentMode = "object" | "keepTransform";

export type Scene3dClearParentMode = "clear" | "keepTransform" | "clearInverse";

export function createScene3dGroupNode(): Diagram3dNodeV1 {
  return createDefaultDiagram3dGroupNode(nextGroupId());
}

/** Group all selected nodes under a new empty group at scene root. */
export function groupScene3dSelection(scene: SceneV1, selectedNodeIds: readonly string[]): {
  scene: SceneV1;
  groupId: string;
} | null {
  if (selectedNodeIds.length === 0) {
    return null;
  }
  const group = createScene3dGroupNode();
  let next = addScene3dNode(scene, group, null);
  for (const nodeId of selectedNodeIds) {
    if (nodeId === group.id) {
      continue;
    }
    next = moveScene3dNode(next, nodeId, group.id);
  }
  return { scene: next, groupId: group.id };
}

function filterNodesForParenting(
  diagram: DiagramV1,
  selectedNodeIds: readonly string[],
  parentGroupId: string,
): string[] {
  return selectedNodeIds.filter((nodeId) => {
    if (nodeId === parentGroupId) {
      return false;
    }
    const moving = findDiagram3dNode(diagram, nodeId);
    if (
      moving?.type === "group3d" &&
      (parentGroupId === nodeId || group3dContainsNodeId(moving, parentGroupId))
    ) {
      return false;
    }
    return true;
  });
}

/** Resolve Blender-style parent target: active group, or wrap active model in a group. */
export function resolveScene3dParentTargetGroup(
  scene: SceneV1,
  activeNodeId: string,
): { scene: SceneV1; parentGroupId: string; wrappedActive: boolean } | null {
  const diagram = sceneV1ToDiagramV1(scene);
  const active = findDiagram3dNode(diagram, activeNodeId);
  if (active == null) {
    return null;
  }
  if (active.type === "group3d") {
    return { scene, parentGroupId: activeNodeId, wrappedActive: false };
  }

  const groupId = nextGroupId();
  const wrapped = wrapDiagram3dModelInGroup(diagram, activeNodeId, groupId);
  if (wrapped == null) {
    return null;
  }
  return {
    scene: mergeDiagram3dIntoScene(scene, wrapped),
    parentGroupId: groupId,
    wrappedActive: true,
  };
}

/** Whether selection can be parented to the active object. */
export function canParentScene3dSelectionToActive(
  scene: SceneV1,
  selectedNodeIds: readonly string[],
  activeNodeId: string | null,
): boolean {
  if (selectedNodeIds.length === 0 || activeNodeId == null) {
    return false;
  }
  const resolved = resolveScene3dParentTargetGroup(scene, activeNodeId);
  if (resolved == null) {
    return false;
  }
  const nodeIds = filterNodesForParenting(
    sceneV1ToDiagramV1(resolved.scene),
    selectedNodeIds,
    resolved.parentGroupId,
  );
  return nodeIds.length > 0;
}

/** Parent selection to the active object (Blender Ctrl+P → Object / Keep Transform). */
export function parentScene3dSelectionToActive(
  scene: SceneV1,
  selectedNodeIds: readonly string[],
  activeNodeId: string,
  mode: Scene3dParentMode,
): { scene: SceneV1; parentGroupId: string; wrappedActive: boolean } | null {
  if (selectedNodeIds.length === 0) {
    return null;
  }

  const resolved = resolveScene3dParentTargetGroup(scene, activeNodeId);
  if (resolved == null) {
    return null;
  }

  let diagram = sceneV1ToDiagramV1(resolved.scene);
  const parentGroupId = resolved.parentGroupId;
  const nodeIds = filterNodesForParenting(diagram, selectedNodeIds, parentGroupId);
  if (nodeIds.length === 0) {
    return null;
  }

  let changed = resolved.wrappedActive;
  for (const nodeId of nodeIds) {
    const before = diagram;
    diagram =
      mode === "keepTransform"
        ? moveDiagram3dNodeToParentKeepTransform(diagram, nodeId, parentGroupId)
        : moveDiagram3dNodeToParent(diagram, nodeId, parentGroupId);
    if (diagram !== before) {
      changed = true;
    }
  }

  if (!changed) {
    return null;
  }

  return {
    scene: mergeDiagram3dIntoScene(resolved.scene, diagram),
    parentGroupId,
    wrappedActive: resolved.wrappedActive,
  };
}

/** @deprecated Use parentScene3dSelectionToActive — kept for tests. */
export function parentScene3dSelectionToGroup(
  scene: SceneV1,
  selectedNodeIds: readonly string[],
  activeGroupId: string,
): SceneV1 | null {
  const result = parentScene3dSelectionToActive(scene, selectedNodeIds, activeGroupId, "object");
  return result?.scene ?? null;
}

/** Whether any selected node has a parent group (can clear). */
export function canClearScene3dSelectionParent(
  scene: SceneV1,
  selectedNodeIds: readonly string[],
): boolean {
  if (selectedNodeIds.length === 0) {
    return false;
  }
  const diagram = sceneV1ToDiagramV1(scene);
  return selectedNodeIds.some((nodeId) => {
    const parentId = findDiagram3dNodeParentId(diagram, nodeId);
    return typeof parentId === "string";
  });
}

/** Move selected nodes to scene root or rebake local transform (Blender Alt+P menu). */
export function clearScene3dSelectionParent(
  scene: SceneV1,
  selectedNodeIds: readonly string[],
  mode: Scene3dClearParentMode = "clear",
): SceneV1 | null {
  let diagram = sceneV1ToDiagramV1(scene);
  let changed = false;

  for (const nodeId of selectedNodeIds) {
    const parentId = findDiagram3dNodeParentId(diagram, nodeId);
    if (typeof parentId !== "string") {
      continue;
    }
    const before = diagram;
    if (mode === "clearInverse") {
      diagram = clearDiagram3dNodeParentInverse(diagram, nodeId);
    } else {
      diagram =
        mode === "keepTransform"
          ? moveDiagram3dNodeToParentKeepTransform(diagram, nodeId, null)
          : moveDiagram3dNodeToParent(diagram, nodeId, null);
    }
    if (diagram !== before) {
      changed = true;
    }
  }

  return changed ? mergeDiagram3dIntoScene(scene, diagram) : null;
}

export function listScene3dGroupTargetIds(scene: SceneV1, excludeNodeId?: string): string[] {
  return listDiagram3dGroupIds(sceneV1ToDiagramV1(scene)).filter((id) => id !== excludeNodeId);
}
