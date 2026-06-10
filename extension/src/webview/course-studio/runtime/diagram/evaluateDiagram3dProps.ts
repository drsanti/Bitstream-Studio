import type {
  Diagram3dMaterialV1,
  Diagram3dModelNodeV1,
  Diagram3dNodeV1,
  Diagram3dRotationV1,
  DiagramV1,
  NumericPropV1,
  Vec3PropV1,
} from "../../schemas/diagram.v1";
import { getDiagram3dNodes } from "../../schemas/normalizeDiagramV1";
import type { DiagramLiveSnapshot } from "./diagramBindingCatalog";
import { evaluateNumericProp, resolveBindingNumber } from "./evaluateDiagramScene";

export type ResolvedEulerRotation = {
  kind: "euler";
  pitch: number;
  yaw: number;
  roll: number;
};

export type ResolvedQuaternionRotation = {
  kind: "quaternion";
  qw: number;
  qx: number;
  qy: number;
  qz: number;
};

export type ResolvedRotation3d =
  | ResolvedEulerRotation
  | ResolvedQuaternionRotation
  | { kind: "none" };

export type ResolvedModel3dProps = {
  id: string;
  type: "model";
  modelId: Diagram3dModelNodeV1["modelId"];
  position: [number, number, number];
  rotation: ResolvedRotation3d;
  scale: [number, number, number];
  opacity: number;
  visible: boolean;
  material?: Diagram3dMaterialV1;
  animationClip?: string;
  animationLoop?: boolean;
  animationPlaying?: boolean;
};

export type ResolvedGroup3dProps = {
  id: string;
  type: "group3d";
  position: [number, number, number];
  rotation: ResolvedRotation3d;
  scale: [number, number, number];
  opacity: number;
  visible: boolean;
  children: ResolvedDiagram3dTreeNode[];
};

export type ResolvedDiagram3dTreeNode = ResolvedModel3dProps | ResolvedGroup3dProps;

export type ResolvedDiagram3dNodeProps = ResolvedModel3dProps | Omit<ResolvedGroup3dProps, "children">;

export type ResolvedDiagram3dProps = {
  diagramId: string;
  roots: ResolvedDiagram3dTreeNode[];
  nodes: ResolvedDiagram3dNodeProps[];
};

function evaluateVec3Component(
  prop: NumericPropV1 | undefined,
  snapshot: DiagramLiveSnapshot,
  fallback: number,
): number {
  if (prop === undefined) {
    return fallback;
  }
  return evaluateNumericProp(prop, snapshot);
}

function evaluateVec3(
  vec: Vec3PropV1 | undefined,
  snapshot: DiagramLiveSnapshot,
  fallback: [number, number, number],
): [number, number, number] {
  return [
    evaluateVec3Component(vec?.x, snapshot, fallback[0]),
    evaluateVec3Component(vec?.y, snapshot, fallback[1]),
    evaluateVec3Component(vec?.z, snapshot, fallback[2]),
  ];
}

function evaluateRotation3d(
  rotation: Diagram3dRotationV1 | undefined,
  snapshot: DiagramLiveSnapshot,
): ResolvedRotation3d {
  if (rotation == null) {
    return { kind: "none" };
  }

  if (Array.isArray(rotation)) {
    const [pitch, yaw, roll] = rotation;
    return { kind: "euler", pitch, yaw, roll };
  }

  if (rotation.kind === "euler") {
    return {
      kind: "euler",
      pitch: evaluateNumericProp(rotation.pitch, snapshot),
      yaw: evaluateNumericProp(rotation.yaw ?? 0, snapshot),
      roll: evaluateNumericProp(rotation.roll, snapshot),
    };
  }

  return {
    kind: "quaternion",
    qw: resolveBindingNumber(rotation.bindings.qw, snapshot),
    qx: resolveBindingNumber(rotation.bindings.qx, snapshot),
    qy: resolveBindingNumber(rotation.bindings.qy, snapshot),
    qz: resolveBindingNumber(rotation.bindings.qz, snapshot),
  };
}

function resolveModelNode(
  node: Diagram3dModelNodeV1,
  snapshot: DiagramLiveSnapshot,
): ResolvedModel3dProps {
  return {
    id: node.id,
    type: "model",
    modelId: node.modelId,
    position: evaluateVec3(node.position, snapshot, [0, 0, 0]),
    rotation: evaluateRotation3d(node.rotation, snapshot),
    scale: evaluateVec3(node.scale, snapshot, [1, 1, 1]),
    opacity: node.opacity ?? 1,
    visible: node.visible !== false,
    material: node.material,
    ...(node.animationClip != null ? { animationClip: node.animationClip } : {}),
    ...(node.animationLoop !== undefined ? { animationLoop: node.animationLoop } : {}),
    ...(node.animationPlaying !== undefined ? { animationPlaying: node.animationPlaying } : {}),
  };
}

function resolveTreeNodes(
  nodes: Diagram3dNodeV1[],
  snapshot: DiagramLiveSnapshot,
): ResolvedDiagram3dTreeNode[] {
  const out: ResolvedDiagram3dTreeNode[] = [];

  for (const node of nodes) {
    if (node.type === "model") {
      out.push(resolveModelNode(node, snapshot));
      continue;
    }

    out.push({
      id: node.id,
      type: "group3d",
      position: evaluateVec3(node.position, snapshot, [0, 0, 0]),
      rotation: evaluateRotation3d(node.rotation, snapshot),
      scale: evaluateVec3(node.scale, snapshot, [1, 1, 1]),
      opacity: node.opacity ?? 1,
      visible: node.visible !== false,
      children: resolveTreeNodes(node.children, snapshot),
    });
  }

  return out;
}

function flattenResolvedTree(
  nodes: ResolvedDiagram3dTreeNode[],
  out: ResolvedDiagram3dNodeProps[],
): void {
  for (const node of nodes) {
    if (node.type === "model") {
      out.push(node);
      continue;
    }

    out.push({
      id: node.id,
      type: "group3d",
      position: node.position,
      rotation: node.rotation,
      scale: node.scale,
      opacity: node.opacity,
      visible: node.visible,
    });
    flattenResolvedTree(node.children, out);
  }
}

export function countResolvedDiagram3dModels(nodes: ResolvedDiagram3dTreeNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.type === "model") {
      count += 1;
    } else {
      count += countResolvedDiagram3dModels(node.children);
    }
  }
  return count;
}

/** Evaluate bindable 3D diagram properties into plain values for render/tests. */
export function evaluateDiagram3dProps(
  diagram: DiagramV1,
  snapshot: DiagramLiveSnapshot,
): ResolvedDiagram3dProps {
  const roots = resolveTreeNodes(getDiagram3dNodes(diagram), snapshot);
  const nodes: ResolvedDiagram3dNodeProps[] = [];
  flattenResolvedTree(roots, nodes);
  return { diagramId: diagram.id, roots, nodes };
}

export function findResolved3dNode(
  resolved: ResolvedDiagram3dProps,
  nodeId: string,
): ResolvedDiagram3dNodeProps | undefined {
  return resolved.nodes.find((node) => node.id === nodeId);
}

export function findResolved3dModelNode(
  resolved: ResolvedDiagram3dProps,
  nodeId: string,
): ResolvedModel3dProps | undefined {
  const node = findResolved3dNode(resolved, nodeId);
  return node?.type === "model" ? node : undefined;
}
