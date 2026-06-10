import { Euler, Matrix4, Object3D, Quaternion, Vector3 } from "three";
import type { DiagramV1 } from "../../schemas/diagram.v1";
import { DIAGRAM_DESIGN_TIME_SNAPSHOT } from "./diagramDesignTimeSnapshot";
import {
  findDiagram3dNodeParentId,
  moveDiagram3dNodeToParent,
  patchDiagram3dNode,
  type Diagram3dNodePatch,
} from "./diagram3dNodeMutations";
import {
  evaluateDiagram3dProps,
  type ResolvedDiagram3dTreeNode,
  type ResolvedRotation3d,
} from "./evaluateDiagram3dProps";
import { roundDiagram3dPositionComponent } from "./diagram3dPositionSnap";
import { applyResolvedRotationToObject3D } from "./diagram3dTransform";

function localMatrixFromResolved(
  position: [number, number, number],
  rotation: ResolvedRotation3d,
  scale: [number, number, number],
): Matrix4 {
  const obj = new Object3D();
  obj.position.set(position[0], position[1], position[2]);
  applyResolvedRotationToObject3D(obj, rotation);
  obj.scale.set(scale[0], scale[1], scale[2]);
  obj.updateMatrix();
  return obj.matrix.clone();
}

function findWorldMatrixInTree(
  nodes: ResolvedDiagram3dTreeNode[],
  nodeId: string,
  parentWorld: Matrix4,
): Matrix4 | null {
  for (const node of nodes) {
    const local = localMatrixFromResolved(node.position, node.rotation, node.scale);
    const world = parentWorld.clone().multiply(local);
    if (node.id === nodeId) {
      return world;
    }
    if (node.type === "group3d") {
      const found = findWorldMatrixInTree(node.children, nodeId, world);
      if (found != null) {
        return found;
      }
    }
  }
  return null;
}

export function computeDiagram3dNodeWorldMatrix(diagram: DiagramV1, nodeId: string): Matrix4 | null {
  const resolved = evaluateDiagram3dProps(diagram, DIAGRAM_DESIGN_TIME_SNAPSHOT);
  return findWorldMatrixInTree(resolved.roots, nodeId, new Matrix4());
}

function matrixToStaticNodePatch(localMatrix: Matrix4): Diagram3dNodePatch {
  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  localMatrix.decompose(position, quaternion, scale);

  const euler = new Euler().setFromQuaternion(quaternion, "XYZ");
  const pitch = roundDiagram3dPositionComponent((euler.x * 180) / Math.PI, 2);
  const yaw = roundDiagram3dPositionComponent((euler.y * 180) / Math.PI, 2);
  const roll = roundDiagram3dPositionComponent((euler.z * 180) / Math.PI, 2);

  return {
    positionX: roundDiagram3dPositionComponent(position.x, 3),
    positionY: roundDiagram3dPositionComponent(position.y, 3),
    positionZ: roundDiagram3dPositionComponent(position.z, 3),
    rotation: [pitch, yaw, roll],
    scaleX: roundDiagram3dPositionComponent(scale.x, 3),
    scaleY: roundDiagram3dPositionComponent(scale.y, 3),
    scaleZ: roundDiagram3dPositionComponent(scale.z, 3),
  };
}

/** Reparent while preserving world-space transform (Blender “Object (Keep Transform)”). */
export function moveDiagram3dNodeToParentKeepTransform(
  diagram: DiagramV1,
  nodeId: string,
  parentGroupId: string | null,
): DiagramV1 {
  const nodeWorld = computeDiagram3dNodeWorldMatrix(diagram, nodeId);
  if (nodeWorld == null) {
    return diagram;
  }

  const next = moveDiagram3dNodeToParent(diagram, nodeId, parentGroupId);
  if (next === diagram) {
    return diagram;
  }

  let parentWorld = new Matrix4();
  if (parentGroupId != null) {
    const resolvedParentWorld = computeDiagram3dNodeWorldMatrix(next, parentGroupId);
    if (resolvedParentWorld == null) {
      return next;
    }
    parentWorld = resolvedParentWorld;
  }

  const localMatrix = parentWorld.clone().invert().multiply(nodeWorld);
  return patchDiagram3dNode(next, nodeId, matrixToStaticNodePatch(localMatrix));
}

/** Rebake local transform from current world pose while keeping the same parent (Blender Alt+P → Clear Parent Inverse). */
export function clearDiagram3dNodeParentInverse(
  diagram: DiagramV1,
  nodeId: string,
): DiagramV1 {
  const parentId = findDiagram3dNodeParentId(diagram, nodeId);
  if (typeof parentId !== "string") {
    return diagram;
  }

  const nodeWorld = computeDiagram3dNodeWorldMatrix(diagram, nodeId);
  const parentWorld = computeDiagram3dNodeWorldMatrix(diagram, parentId);
  if (nodeWorld == null || parentWorld == null) {
    return diagram;
  }

  const localMatrix = parentWorld.clone().invert().multiply(nodeWorld);
  return patchDiagram3dNode(diagram, nodeId, matrixToStaticNodePatch(localMatrix));
}
