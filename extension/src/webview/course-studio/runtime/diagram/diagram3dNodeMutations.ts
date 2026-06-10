import type {
  Diagram3dCameraV1,
  Diagram3dGroupNodeV1,
  Diagram3dMaterialV1,
  Diagram3dModelIdV1,
  Diagram3dModelNodeV1,
  Diagram3dNodeV1,
  Diagram3dRotationV1,
  DiagramV1,
  NumericPropV1,
} from "../../schemas/diagram.v1";
import { mergeDiagram3dMaterialPatch } from "./diagram3dMaterial";
import {
  getDiagram3dLayer,
  syncDiagramLayers,
} from "../../schemas/normalizeDiagramV1";
import { DEFAULT_DIAGRAM_3D_CAMERA, readDiagram3dCamera } from "./diagram3dCamera";

export type Diagram3dNodeListEntry = {
  id: string;
  type: Diagram3dNodeV1["type"];
  modelId?: Diagram3dModelIdV1;
};

export type Diagram3dNodePatch = {
  modelId?: Diagram3dModelIdV1;
  positionX?: NumericPropV1;
  positionY?: NumericPropV1;
  positionZ?: NumericPropV1;
  scaleX?: NumericPropV1;
  scaleY?: NumericPropV1;
  scaleZ?: NumericPropV1;
  rotation?: Diagram3dRotationV1 | null;
  opacity?: number;
  visible?: boolean;
  material?: Partial<Diagram3dMaterialV1> | null;
  animationClip?: string | null;
  animationLoop?: boolean;
  animationPlaying?: boolean;
};

export function readDiagram3dScaleAxis(
  node: { scale?: Diagram3dModelNodeV1["scale"] },
  axis: "x" | "y" | "z",
): number {
  const value = node.scale?.[axis];
  return typeof value === "number" ? value : 1;
}

export function defaultBmi270QuaternionRotation(): Diagram3dRotationV1 {
  return {
    kind: "quaternion",
    bindings: {
      qw: { path: "bmi270.qw", fallback: 1 },
      qx: { path: "bmi270.qx", fallback: 0 },
      qy: { path: "bmi270.qy", fallback: 0 },
      qz: { path: "bmi270.qz", fallback: 0 },
    },
  };
}

const GYRO_RATE_TO_DEGREE_MAP = [
  { op: "scale" as const, inMin: -250, inMax: 250, outMin: -50, outMax: 50 },
];

export function defaultGyroRateEulerRotation(): Diagram3dRotationV1 {
  return {
    kind: "euler",
    pitch: {
      binding: { path: "bmi270.gx", map: GYRO_RATE_TO_DEGREE_MAP, fallback: 0 },
    },
    yaw: {
      binding: { path: "bmi270.gy", map: GYRO_RATE_TO_DEGREE_MAP, fallback: 0 },
    },
    roll: {
      binding: { path: "bmi270.gz", map: GYRO_RATE_TO_DEGREE_MAP, fallback: 0 },
    },
  };
}

export function createDefaultDiagram3dModelNode(id: string): Diagram3dModelNodeV1 {
  return {
    id,
    type: "model",
    modelId: "procedural-pcb",
    rotation: defaultBmi270QuaternionRotation(),
  };
}

function with3dNodes(
  diagram: DiagramV1,
  nodes3d: Diagram3dNodeV1[],
  camera?: Diagram3dCameraV1,
): DiagramV1 {
  if (nodes3d.length === 0) {
    return syncDiagramLayers({ ...diagram, layers: [{ kind: "2d", nodes: diagram.nodes }] });
  }
  return syncDiagramLayers({
    ...diagram,
    layers: [
      { kind: "2d", nodes: diagram.nodes },
      {
        kind: "3d",
        nodes: nodes3d,
        ...(camera != null ? { camera } : {}),
      },
    ],
  });
}

export function listDiagram3dNodes(diagram: DiagramV1): Diagram3dNodeListEntry[] {
  const layer = getDiagram3dLayer(diagram);
  if (layer == null) {
    return [];
  }
  const out: Diagram3dNodeListEntry[] = [];
  walkListDiagram3dNodes(layer.nodes, out);
  return out;
}

function walkListDiagram3dNodes(nodes: Diagram3dNodeV1[], out: Diagram3dNodeListEntry[]): void {
  for (const node of nodes) {
    out.push({
      id: node.id,
      type: node.type,
      ...(node.type === "model" ? { modelId: node.modelId } : {}),
    });
    if (node.type === "group3d") {
      walkListDiagram3dNodes(node.children, out);
    }
  }
}

export function findDiagram3dNode(
  diagram: DiagramV1,
  nodeId: string,
): Diagram3dNodeV1 | null {
  const layer = getDiagram3dLayer(diagram);
  if (layer == null) {
    return null;
  }
  return walkFind3dNode(layer.nodes, nodeId);
}

function walkFind3dNode(nodes: Diagram3dNodeV1[], nodeId: string): Diagram3dNodeV1 | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }
    if (node.type === "group3d") {
      const found = walkFind3dNode(node.children, nodeId);
      if (found != null) {
        return found;
      }
    }
  }
  return null;
}

export function createDefaultDiagram3dGroupNode(id: string): Diagram3dNodeV1 {
  return {
    id,
    type: "group3d",
    children: [],
  };
}

export function addDiagram3dGroupNode(diagram: DiagramV1, group: Diagram3dGroupNodeV1): DiagramV1 {
  const layer = getDiagram3dLayer(diagram);
  const nodes = layer != null ? [...layer.nodes, group] : [group];
  return with3dNodes(diagram, nodes, layer?.camera ?? DEFAULT_DIAGRAM_3D_CAMERA);
}

function patchVec3Prop(
  current: Diagram3dModelNodeV1["scale"],
  patch: Pick<Diagram3dNodePatch, "scaleX" | "scaleY" | "scaleZ">,
): Diagram3dModelNodeV1["scale"] | undefined {
  if (patch.scaleX === undefined && patch.scaleY === undefined && patch.scaleZ === undefined) {
    return undefined;
  }
  const scale = { ...current };
  if (patch.scaleX !== undefined) {
    scale.x = patch.scaleX;
  }
  if (patch.scaleY !== undefined) {
    scale.y = patch.scaleY;
  }
  if (patch.scaleZ !== undefined) {
    scale.z = patch.scaleZ;
  }
  return scale;
}

function patchGroupNode(node: Diagram3dGroupNodeV1, patch: Diagram3dNodePatch): Diagram3dGroupNodeV1 {
  const position = { ...node.position };
  if (patch.positionX !== undefined) {
    position.x = patch.positionX;
  }
  if (patch.positionY !== undefined) {
    position.y = patch.positionY;
  }
  if (patch.positionZ !== undefined) {
    position.z = patch.positionZ;
  }
  const scale = patchVec3Prop(node.scale, patch);

  return {
    ...node,
    ...(patch.opacity !== undefined ? { opacity: patch.opacity } : {}),
    ...(patch.visible !== undefined ? { visible: patch.visible } : {}),
    ...(patch.rotation !== undefined
      ? patch.rotation == null
        ? { rotation: undefined }
        : { rotation: patch.rotation }
      : {}),
    ...(patch.positionX !== undefined ||
    patch.positionY !== undefined ||
    patch.positionZ !== undefined
      ? { position }
      : {}),
    ...(scale !== undefined ? { scale } : {}),
  };
}

function patch3dNodeInTree(
  nodes: Diagram3dNodeV1[],
  nodeId: string,
  patch: Diagram3dNodePatch,
): Diagram3dNodeV1[] {
  return nodes.map((node) => {
    if (node.id === nodeId && node.type === "model") {
      return patchModelNode(node, patch);
    }
    if (node.id === nodeId && node.type === "group3d") {
      return patchGroupNode(node, patch);
    }
    if (node.type === "group3d") {
      return {
        ...node,
        children: patch3dNodeInTree(node.children, nodeId, patch),
      };
    }
    return node;
  });
}

function patchModelNode(
  node: Diagram3dModelNodeV1,
  patch: Diagram3dNodePatch,
): Diagram3dModelNodeV1 {
  const position = { ...node.position };
  if (patch.positionX !== undefined) {
    position.x = patch.positionX;
  }
  if (patch.positionY !== undefined) {
    position.y = patch.positionY;
  }
  if (patch.positionZ !== undefined) {
    position.z = patch.positionZ;
  }
  const scale = patchVec3Prop(node.scale, patch);

  return {
    ...node,
    ...(patch.modelId !== undefined ? { modelId: patch.modelId } : {}),
    ...(patch.opacity !== undefined ? { opacity: patch.opacity } : {}),
    ...(patch.visible !== undefined ? { visible: patch.visible } : {}),
    ...(patch.material !== undefined
      ? { material: mergeDiagram3dMaterialPatch(node.material, patch.material) }
      : {}),
    ...(patch.rotation !== undefined
      ? patch.rotation == null
        ? { rotation: undefined }
        : { rotation: patch.rotation }
      : {}),
    ...(patch.positionX !== undefined ||
    patch.positionY !== undefined ||
    patch.positionZ !== undefined
      ? { position }
      : {}),
    ...(scale !== undefined ? { scale } : {}),
    ...(patch.animationClip !== undefined
      ? patch.animationClip == null
        ? { animationClip: undefined }
        : { animationClip: patch.animationClip }
      : {}),
    ...(patch.animationLoop !== undefined ? { animationLoop: patch.animationLoop } : {}),
    ...(patch.animationPlaying !== undefined ? { animationPlaying: patch.animationPlaying } : {}),
  };
}

export function patchDiagram3dNode(
  diagram: DiagramV1,
  nodeId: string,
  patch: Diagram3dNodePatch,
): DiagramV1 {
  const layer = getDiagram3dLayer(diagram);
  if (layer == null) {
    return diagram;
  }
  const nodes = patch3dNodeInTree(layer.nodes, nodeId, patch);
  return with3dNodes(diagram, nodes, layer.camera);
}

export function addDiagram3dNode(
  diagram: DiagramV1,
  node: Diagram3dNodeV1,
): DiagramV1 {
  return addDiagram3dNodeToParent(diagram, node, null);
}

export function addDiagram3dNodeToParent(
  diagram: DiagramV1,
  node: Diagram3dNodeV1,
  parentGroupId: string | null,
): DiagramV1 {
  const layer = getDiagram3dLayer(diagram);
  const nodes =
    layer != null
      ? insertDiagram3dNodeInTree(layer.nodes, parentGroupId, node)
      : [node];
  return with3dNodes(diagram, nodes, layer?.camera ?? DEFAULT_DIAGRAM_3D_CAMERA);
}

function insertDiagram3dNodeInTree(
  nodes: Diagram3dNodeV1[],
  parentGroupId: string | null,
  node: Diagram3dNodeV1,
): Diagram3dNodeV1[] {
  if (parentGroupId == null) {
    return [...nodes, node];
  }

  return nodes.map((entry) => {
    if (entry.id === parentGroupId && entry.type === "group3d") {
      return { ...entry, children: [...entry.children, node] };
    }
    if (entry.type === "group3d") {
      return {
        ...entry,
        children: insertDiagram3dNodeInTree(entry.children, parentGroupId, node),
      };
    }
    return entry;
  });
}

function extractDiagram3dNodeFromTree(
  nodes: Diagram3dNodeV1[],
  nodeId: string,
): [Diagram3dNodeV1 | null, Diagram3dNodeV1[]] {
  for (let index = 0; index < nodes.length; index += 1) {
    const entry = nodes[index]!;
    if (entry.id === nodeId) {
      return [entry, [...nodes.slice(0, index), ...nodes.slice(index + 1)]];
    }
    if (entry.type === "group3d") {
      const [found, children] = extractDiagram3dNodeFromTree(entry.children, nodeId);
      if (found != null) {
        const next = nodes.map((candidate, candidateIndex) =>
          candidateIndex === index ? { ...entry, children } : candidate,
        );
        return [found, next];
      }
    }
  }
  return [null, nodes];
}

export function group3dContainsNodeId(group: Diagram3dGroupNodeV1, nodeId: string): boolean {
  for (const child of group.children) {
    if (child.id === nodeId) {
      return true;
    }
    if (child.type === "group3d" && group3dContainsNodeId(child, nodeId)) {
      return true;
    }
  }
  return false;
}

export function findDiagram3dNodeParentId(
  diagram: DiagramV1,
  nodeId: string,
): string | null | undefined {
  const layer = getDiagram3dLayer(diagram);
  if (layer == null) {
    return undefined;
  }
  return walkFindDiagram3dParentId(layer.nodes, nodeId, null);
}

function walkFindDiagram3dParentId(
  nodes: Diagram3dNodeV1[],
  nodeId: string,
  parentId: string | null,
): string | null | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return parentId;
    }
    if (node.type === "group3d") {
      const found = walkFindDiagram3dParentId(node.children, nodeId, node.id);
      if (found !== undefined) {
        return found;
      }
    }
  }
  return undefined;
}

export function listDiagram3dGroupIds(diagram: DiagramV1): string[] {
  return listDiagram3dNodes(diagram)
    .filter((entry) => entry.type === "group3d")
    .map((entry) => entry.id);
}

export function moveDiagram3dNodeToParent(
  diagram: DiagramV1,
  nodeId: string,
  parentGroupId: string | null,
): DiagramV1 {
  if (nodeId === parentGroupId) {
    return diagram;
  }

  const layer = getDiagram3dLayer(diagram);
  if (layer == null) {
    return diagram;
  }

  const moving = findDiagram3dNode(diagram, nodeId);
  if (moving == null) {
    return diagram;
  }

  if (parentGroupId != null) {
    const target = findDiagram3dNode(diagram, parentGroupId);
    if (target?.type !== "group3d") {
      return diagram;
    }
    if (
      moving.type === "group3d" &&
      (parentGroupId === nodeId || group3dContainsNodeId(moving, parentGroupId))
    ) {
      return diagram;
    }
  }

  const [extracted, without] = extractDiagram3dNodeFromTree(layer.nodes, nodeId);
  if (extracted == null) {
    return diagram;
  }

  const inserted = insertDiagram3dNodeInTree(without, parentGroupId, extracted);
  return with3dNodes(diagram, inserted, layer.camera);
}

/** Wrap a model in an empty group so other nodes can parent to it (Blender “Object” target). */
export function wrapDiagram3dModelInGroup(
  diagram: DiagramV1,
  modelId: string,
  groupId: string,
): DiagramV1 | null {
  const layer = getDiagram3dLayer(diagram);
  if (layer == null) {
    return null;
  }

  const parentGroupId = findDiagram3dNodeParentId(diagram, modelId);
  if (parentGroupId === undefined) {
    return null;
  }

  const [extracted, without] = extractDiagram3dNodeFromTree(layer.nodes, modelId);
  if (extracted?.type !== "model") {
    return null;
  }

  const group: Diagram3dGroupNodeV1 = {
    id: groupId,
    type: "group3d",
    ...(extracted.position != null ? { position: extracted.position } : {}),
    ...(extracted.rotation != null ? { rotation: extracted.rotation } : {}),
    ...(extracted.scale != null ? { scale: extracted.scale } : {}),
    children: [
      {
        ...extracted,
        position: { x: 0, y: 0, z: 0 },
        rotation: [0, 0, 0],
        scale: { x: 1, y: 1, z: 1 },
      },
    ],
  };

  const inserted = insertDiagram3dNodeInTree(without, parentGroupId, group);
  return with3dNodes(diagram, inserted, layer.camera);
}

export function removeDiagram3dNode(diagram: DiagramV1, nodeId: string): DiagramV1 {
  const layer = getDiagram3dLayer(diagram);
  if (layer == null) {
    return diagram;
  }
  const nodes = remove3dNodeFromTree(layer.nodes, nodeId);
  return with3dNodes(diagram, nodes, layer.camera);
}

function remove3dNodeFromTree(nodes: Diagram3dNodeV1[], nodeId: string): Diagram3dNodeV1[] {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) =>
      node.type === "group3d"
        ? { ...node, children: remove3dNodeFromTree(node.children, nodeId) }
        : node,
    );
}

export type Diagram3dCameraPatch = {
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  fov?: number;
};

export function patchDiagram3dCamera(diagram: DiagramV1, patch: Diagram3dCameraPatch): DiagramV1 {
  const layer = getDiagram3dLayer(diagram);
  if (layer == null) {
    return diagram;
  }
  const current = readDiagram3dCamera(diagram);
  const nextCamera: Diagram3dCameraV1 = {
    position: [
      patch.positionX ?? current.position[0],
      patch.positionY ?? current.position[1],
      patch.positionZ ?? current.position[2],
    ],
    fov: patch.fov ?? current.fov,
  };
  return with3dNodes(diagram, layer.nodes, nextCamera);
}

export function resetDiagram3dCamera(diagram: DiagramV1): DiagramV1 {
  const layer = getDiagram3dLayer(diagram);
  if (layer == null) {
    return diagram;
  }
  return with3dNodes(diagram, layer.nodes, DEFAULT_DIAGRAM_3D_CAMERA);
}

export function ensureDiagram3dLayerWithModel(diagram: DiagramV1): DiagramV1 {
  if (getDiagram3dLayer(diagram) != null) {
    return diagram;
  }
  return addDiagram3dNode(
    diagram,
    createDefaultDiagram3dModelNode(`model-${Date.now().toString(36)}`),
  );
}

function cloneDiagram3dNodeWithNewId(
  node: Diagram3dNodeV1,
  newId: string,
  positionOffset: [number, number, number],
): Diagram3dNodeV1 {
  const cloned = structuredClone(node) as Diagram3dNodeV1;
  cloned.id = newId;
  if (cloned.position == null) {
    cloned.position = { x: positionOffset[0], y: positionOffset[1], z: positionOffset[2] };
  } else {
    cloned.position = {
      ...cloned.position,
      x: (typeof cloned.position.x === "number" ? cloned.position.x : 0) + positionOffset[0],
      y: (typeof cloned.position.y === "number" ? cloned.position.y : 0) + positionOffset[1],
      z: (typeof cloned.position.z === "number" ? cloned.position.z : 0) + positionOffset[2],
    };
  }
  if (cloned.type === "group3d") {
    cloned.children = cloned.children.map((child, index) =>
      cloneDiagram3dNodeWithNewId(child, `${newId}-${index + 1}`, [0, 0, 0]),
    );
  }
  return cloned;
}

/** Deep-copy a 3D node with a new id and a small position offset. */
export function duplicateDiagram3dNode(
  diagram: DiagramV1,
  nodeId: string,
  newId: string,
): DiagramV1 {
  const source = findDiagram3dNode(diagram, nodeId);
  if (source == null) {
    return diagram;
  }
  const parentId = findDiagram3dNodeParentId(diagram, nodeId) ?? null;
  const duplicate = cloneDiagram3dNodeWithNewId(source, newId, [0.35, 0, 0.35]);
  return addDiagram3dNodeToParent(diagram, duplicate, parentId);
}
