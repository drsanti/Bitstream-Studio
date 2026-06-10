import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import type { DiagramV1 } from "../../schemas/diagram.v1";
import { canDiagram3dNodeUseRotateGizmo } from "../diagram/diagram3dGizmoHelpers";
import { computeDiagram3dNodeWorldMatrix } from "../diagram/diagram3dHierarchyTransform";
import {
  findDiagram3dNode,
  findDiagram3dNodeParentId,
  patchDiagram3dNode,
  readDiagram3dScaleAxis,
  type Diagram3dNodePatch,
} from "../diagram/diagram3dNodeMutations";
import { roundDiagram3dPositionComponent } from "../diagram/diagram3dPositionSnap";
import { mergeDiagram3dIntoScene, sceneV1ToDiagramV1 } from "./sceneDiagramBridge";
import type { SceneV1 } from "../../schemas/scene.v1";

export type Scene3dMultiGizmoSnapshot = {
  worldMatrices: Record<string, Matrix4>;
};

export type Scene3dMultiGizmoPatch = {
  nodeId: string;
  patch: Diagram3dNodePatch;
};

function worldPositionFromMatrix(matrix: Matrix4): Vector3 {
  const position = new Vector3();
  matrix.decompose(position, new Quaternion(), new Vector3());
  return position;
}

function patchFromWorldMatrix(diagram: DiagramV1, nodeId: string, worldMatrix: Matrix4): Diagram3dNodePatch {
  const parentId = findDiagram3dNodeParentId(diagram, nodeId);
  let parentWorld = new Matrix4();
  if (parentId != null) {
    parentWorld = computeDiagram3dNodeWorldMatrix(diagram, parentId) ?? new Matrix4();
  }
  const localMatrix = parentWorld.clone().invert().multiply(worldMatrix);
  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  localMatrix.decompose(position, quaternion, scale);
  const euler = new Euler().setFromQuaternion(quaternion, "XYZ");
  return {
    positionX: roundDiagram3dPositionComponent(position.x, 3),
    positionY: roundDiagram3dPositionComponent(position.y, 3),
    positionZ: roundDiagram3dPositionComponent(position.z, 3),
    rotation: [
      roundDiagram3dPositionComponent((euler.x * 180) / Math.PI, 2),
      roundDiagram3dPositionComponent((euler.y * 180) / Math.PI, 2),
      roundDiagram3dPositionComponent((euler.z * 180) / Math.PI, 2),
    ],
    scaleX: roundDiagram3dPositionComponent(scale.x, 3),
    scaleY: roundDiagram3dPositionComponent(scale.y, 3),
    scaleZ: roundDiagram3dPositionComponent(scale.z, 3),
  };
}

export function captureScene3dMultiGizmoSnapshot(
  scene: SceneV1,
  selectedNodeIds: readonly string[],
): Scene3dMultiGizmoSnapshot | null {
  if (selectedNodeIds.length === 0) {
    return null;
  }
  const diagram = sceneV1ToDiagramV1(scene);
  const worldMatrices: Record<string, Matrix4> = {};
  for (const nodeId of selectedNodeIds) {
    const world = computeDiagram3dNodeWorldMatrix(diagram, nodeId);
    if (world == null) {
      return null;
    }
    worldMatrices[nodeId] = world.clone();
  }
  return { worldMatrices };
}

function activeTranslatePatch(
  position: [number, number, number],
): Diagram3dNodePatch {
  const [x, y, z] = position;
  return {
    positionX: roundDiagram3dPositionComponent(x, 3),
    positionY: roundDiagram3dPositionComponent(y, 3),
    positionZ: roundDiagram3dPositionComponent(z, 3),
  };
}

export function buildScene3dMultiTranslatePatches(
  scene: SceneV1,
  snapshot: Scene3dMultiGizmoSnapshot,
  activeNodeId: string,
  activeNewLocalPosition: [number, number, number],
  selectedNodeIds: readonly string[],
): Scene3dMultiGizmoPatch[] {
  let diagram = sceneV1ToDiagramV1(scene);
  const activePatch = activeTranslatePatch(activeNewLocalPosition);
  diagram = patchDiagram3dNode(diagram, activeNodeId, activePatch);

  const activeOldWorld = worldPositionFromMatrix(snapshot.worldMatrices[activeNodeId]!);
  const activeNewWorld = worldPositionFromMatrix(
    computeDiagram3dNodeWorldMatrix(diagram, activeNodeId)!,
  );
  const delta = activeNewWorld.clone().sub(activeOldWorld);

  const patches: Scene3dMultiGizmoPatch[] = [{ nodeId: activeNodeId, patch: activePatch }];
  for (const nodeId of selectedNodeIds) {
    if (nodeId === activeNodeId) {
      continue;
    }
    const oldWorld = worldPositionFromMatrix(snapshot.worldMatrices[nodeId]!);
    const targetWorld = oldWorld.clone().add(delta);
    const targetMatrix = snapshot.worldMatrices[nodeId]!.clone().setPosition(targetWorld);
    patches.push({
      nodeId,
      patch: patchFromWorldMatrix(diagram, nodeId, targetMatrix),
    });
  }
  return patches;
}

function readStaticEulerDegrees(
  diagram: DiagramV1,
  nodeId: string,
): [number, number, number] | null {
  const node = findDiagram3dNode(diagram, nodeId);
  if (node == null || !canDiagram3dNodeUseRotateGizmo(node.rotation)) {
    return null;
  }
  if (Array.isArray(node.rotation)) {
    return [...node.rotation] as [number, number, number];
  }
  return [0, 0, 0];
}

export function buildScene3dMultiRotatePatches(
  scene: SceneV1,
  snapshot: Scene3dMultiGizmoSnapshot,
  activeNodeId: string,
  activeNewLocalEuler: [number, number, number],
  selectedNodeIds: readonly string[],
): Scene3dMultiGizmoPatch[] | null {
  const diagram = sceneV1ToDiagramV1(scene);
  const activeBefore = readStaticEulerDegrees(diagram, activeNodeId);
  if (activeBefore == null) {
    return null;
  }
  for (const nodeId of selectedNodeIds) {
    if (readStaticEulerDegrees(diagram, nodeId) == null) {
      return null;
    }
  }

  let working = patchDiagram3dNode(diagram, activeNodeId, { rotation: activeNewLocalEuler });
  const activeOldWorld = snapshot.worldMatrices[activeNodeId]!.clone();
  const activeNewWorld = computeDiagram3dNodeWorldMatrix(working, activeNodeId);
  if (activeNewWorld == null) {
    return null;
  }
  const deltaMatrix = activeNewWorld.clone().multiply(activeOldWorld.clone().invert());

  const patches: Scene3dMultiGizmoPatch[] = [
    { nodeId: activeNodeId, patch: { rotation: activeNewLocalEuler } },
  ];
  for (const nodeId of selectedNodeIds) {
    if (nodeId === activeNodeId) {
      continue;
    }
    const oldWorld = snapshot.worldMatrices[nodeId]!;
    const targetWorld = deltaMatrix.clone().multiply(oldWorld);
    patches.push({
      nodeId,
      patch: patchFromWorldMatrix(working, nodeId, targetWorld),
    });
    working = patchDiagram3dNode(working, nodeId, patches[patches.length - 1]!.patch);
  }
  return patches;
}

export function buildScene3dMultiScalePatches(
  scene: SceneV1,
  snapshot: Scene3dMultiGizmoSnapshot,
  activeNodeId: string,
  activeNewLocalScale: [number, number, number],
  selectedNodeIds: readonly string[],
): Scene3dMultiGizmoPatch[] {
  const diagram = sceneV1ToDiagramV1(scene);
  const activeNode = findDiagram3dNode(diagram, activeNodeId);
  const activeOldScale: [number, number, number] = activeNode
    ? [
        readDiagram3dScaleAxis(activeNode, "x"),
        readDiagram3dScaleAxis(activeNode, "y"),
        readDiagram3dScaleAxis(activeNode, "z"),
      ]
    : [1, 1, 1];

  const ratio: [number, number, number] = [
    activeOldScale[0] === 0 ? 1 : activeNewLocalScale[0] / activeOldScale[0],
    activeOldScale[1] === 0 ? 1 : activeNewLocalScale[1] / activeOldScale[1],
    activeOldScale[2] === 0 ? 1 : activeNewLocalScale[2] / activeOldScale[2],
  ];

  const patches: Scene3dMultiGizmoPatch[] = [
    {
      nodeId: activeNodeId,
      patch: {
        scaleX: roundDiagram3dPositionComponent(activeNewLocalScale[0], 3),
        scaleY: roundDiagram3dPositionComponent(activeNewLocalScale[1], 3),
        scaleZ: roundDiagram3dPositionComponent(activeNewLocalScale[2], 3),
      },
    },
  ];

  for (const nodeId of selectedNodeIds) {
    if (nodeId === activeNodeId) {
      continue;
    }
    const node = findDiagram3dNode(diagram, nodeId);
    if (node == null) {
      continue;
    }
    patches.push({
      nodeId,
      patch: {
        scaleX: roundDiagram3dPositionComponent(readDiagram3dScaleAxis(node, "x") * ratio[0], 3),
        scaleY: roundDiagram3dPositionComponent(readDiagram3dScaleAxis(node, "y") * ratio[1], 3),
        scaleZ: roundDiagram3dPositionComponent(readDiagram3dScaleAxis(node, "z") * ratio[2], 3),
      },
    });
  }
  return patches;
}

export function applyScene3dMultiGizmoPatches(scene: SceneV1, patches: Scene3dMultiGizmoPatch[]): SceneV1 {
  let diagram = sceneV1ToDiagramV1(scene);
  for (const entry of patches) {
    diagram = patchDiagram3dNode(diagram, entry.nodeId, entry.patch);
  }
  return mergeDiagram3dIntoScene(scene, diagram);
}

export function computeScene3dMultiPivotPreviewWorldMatrices(
  snapshot: Scene3dMultiGizmoSnapshot,
  pivotStartWorld: Matrix4,
  pivotEndWorld: Matrix4,
  selectedNodeIds: readonly string[],
): Record<string, Matrix4> {
  const delta = pivotEndWorld.clone().multiply(pivotStartWorld.clone().invert());
  const result: Record<string, Matrix4> = {};
  for (const nodeId of selectedNodeIds) {
    const oldWorld = snapshot.worldMatrices[nodeId];
    if (oldWorld != null) {
      result[nodeId] = delta.clone().multiply(oldWorld);
    }
  }
  return result;
}

export function buildScene3dMultiPivotTransformPatches(
  scene: SceneV1,
  snapshot: Scene3dMultiGizmoSnapshot,
  pivotStartWorld: Matrix4,
  pivotEndWorld: Matrix4,
  selectedNodeIds: readonly string[],
): Scene3dMultiGizmoPatch[] {
  const delta = pivotEndWorld.clone().multiply(pivotStartWorld.clone().invert());
  let diagram = sceneV1ToDiagramV1(scene);
  const patches: Scene3dMultiGizmoPatch[] = [];
  for (const nodeId of selectedNodeIds) {
    const oldWorld = snapshot.worldMatrices[nodeId];
    if (oldWorld == null) {
      continue;
    }
    const targetWorld = delta.clone().multiply(oldWorld);
    const patch = patchFromWorldMatrix(diagram, nodeId, targetWorld);
    patches.push({ nodeId, patch });
    diagram = patchDiagram3dNode(diagram, nodeId, patch);
  }
  return patches;
}
