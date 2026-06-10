import { Box3, Matrix4, Object3D, Quaternion, Vector3 } from "three";
import type { DiagramV1 } from "../../schemas/diagram.v1";
import { computeDiagram3dNodeWorldMatrix } from "../diagram/diagram3dHierarchyTransform";
import { findDiagram3dNode } from "../diagram/diagram3dNodeMutations";
import { DIAGRAM_DESIGN_TIME_SNAPSHOT } from "../diagram/diagramDesignTimeSnapshot";
import {
  evaluateDiagram3dProps,
  type ResolvedDiagram3dTreeNode,
} from "../diagram/evaluateDiagram3dProps";

const PIVOT_CORNER = new Vector3();
const PIVOT_WORLD_CORNER = new Vector3();

function findResolvedNode(
  nodes: ResolvedDiagram3dTreeNode[],
  nodeId: string,
): ResolvedDiagram3dTreeNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }
    if (node.type === "group3d") {
      const found = findResolvedNode(node.children, nodeId);
      if (found != null) {
        return found;
      }
    }
  }
  return null;
}

/** Local-space half extents for procedural meshes (matches diagram3dProceduralModels.tsx). */
export function readDiagram3dProceduralMeshLocalHalfExtents(modelId: string): Vector3 {
  switch (modelId) {
    case "procedural-box":
      return new Vector3(0.6, 0.6, 0.6);
    case "procedural-sphere":
      return new Vector3(0.65, 0.65, 0.65);
    case "procedural-cylinder":
      return new Vector3(0.55, 0.6, 0.55);
    case "procedural-cone":
      return new Vector3(0.55, 0.6, 0.55);
    case "procedural-plane":
      return new Vector3(0.75, 0.02, 0.75);
    case "procedural-torus":
      return new Vector3(0.75, 0.2, 0.75);
    case "procedural-capsule":
      return new Vector3(0.35, 0.6, 0.35);
    case "procedural-ring":
      return new Vector3(0.75, 0.04, 0.75);
    case "procedural-icosahedron":
      return new Vector3(0.55, 0.55, 0.55);
    case "procedural-torus-knot":
      return new Vector3(0.65, 0.65, 0.65);
    default:
      return new Vector3(0.5, 0.5, 0.5);
  }
}

function expandWorldBoundsFromNode(
  bounds: Box3,
  diagram: DiagramV1,
  resolvedRoots: ResolvedDiagram3dTreeNode[],
  nodeId: string,
  worldMatrix: Matrix4,
): void {
  const source = findDiagram3dNode(diagram, nodeId);
  const resolved = findResolvedNode(resolvedRoots, nodeId);
  const scale = resolved?.scale ?? [1, 1, 1];
  const half =
    source?.type === "model"
      ? readDiagram3dProceduralMeshLocalHalfExtents(source.modelId)
      : new Vector3(0.25, 0.25, 0.25);

  half.x *= scale[0];
  half.y *= scale[1];
  half.z *= scale[2];

  for (const sx of [-1, 1] as const) {
    for (const sy of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        PIVOT_CORNER.set(sx * half.x, sy * half.y, sz * half.z);
        PIVOT_WORLD_CORNER.copy(PIVOT_CORNER).applyMatrix4(worldMatrix);
        bounds.expandByPoint(PIVOT_WORLD_CORNER);
      }
    }
  }
}

export function computeScene3dSelectionWorldBounds(
  diagram: DiagramV1,
  selectedNodeIds: readonly string[],
): Box3 | null {
  if (selectedNodeIds.length === 0) {
    return null;
  }
  const resolved = evaluateDiagram3dProps(diagram, DIAGRAM_DESIGN_TIME_SNAPSHOT);
  const bounds = new Box3();
  let any = false;
  for (const nodeId of selectedNodeIds) {
    const world = computeDiagram3dNodeWorldMatrix(diagram, nodeId);
    if (world == null) {
      continue;
    }
    expandWorldBoundsFromNode(bounds, diagram, resolved.roots, nodeId, world);
    any = true;
  }
  return any ? bounds : null;
}

/** World matrix for the shared selection pivot (AABB center + active object rotation). */
export function computeScene3dSelectionPivotWorldMatrix(
  diagram: DiagramV1,
  selectedNodeIds: readonly string[],
  activeNodeId: string | null,
): Matrix4 | null {
  const bounds = computeScene3dSelectionWorldBounds(diagram, selectedNodeIds);
  if (bounds == null) {
    return null;
  }
  const center = bounds.getCenter(new Vector3());
  const orientId =
    activeNodeId != null && selectedNodeIds.includes(activeNodeId)
      ? activeNodeId
      : selectedNodeIds[selectedNodeIds.length - 1]!;
  const activeWorld = computeDiagram3dNodeWorldMatrix(diagram, orientId);
  const pivot = new Matrix4();
  if (activeWorld != null) {
    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    activeWorld.decompose(position, quaternion, scale);
    pivot.compose(center, quaternion, new Vector3(1, 1, 1));
  } else {
    pivot.makeTranslation(center.x, center.y, center.z);
  }
  return pivot;
}

function isFiniteMatrix4(matrix: Matrix4): boolean {
  const elements = matrix.elements;
  for (let index = 0; index < elements.length; index += 1) {
    if (!Number.isFinite(elements[index]!)) {
      return false;
    }
  }
  return true;
}

export function applyPreviewWorldMatrixToGroup(group: Object3D, worldMatrix: Matrix4): void {
  if (!isFiniteMatrix4(worldMatrix)) {
    return;
  }
  group.parent?.updateMatrixWorld(true);
  const parentWorld = group.parent?.matrixWorld ?? new Matrix4();
  const local = parentWorld.clone().invert().multiply(worldMatrix);
  if (!isFiniteMatrix4(local)) {
    return;
  }
  local.decompose(group.position, group.quaternion, group.scale);
}

export function readObjectWorldMatrix(object: Object3D): Matrix4 {
  object.updateMatrixWorld(true);
  return object.matrixWorld.clone();
}
