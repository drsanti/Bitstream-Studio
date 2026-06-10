import type {
  Diagram3dNodeV1,
  DiagramBindingV1,
  DiagramNodeV1,
  DiagramV1,
  NumericPropV1,
  Vec3PropV1,
} from "../../schemas/diagram.v1";
import { getDiagram3dNodes } from "../../schemas/normalizeDiagramV1";
import {
  isKonvaGateBinding,
  isKonvaNumericPropertyBinding,
  isKonvaTextPropertyBinding,
  type KonvaPropertyBindingValueV1,
} from "../../schemas/konvaPropertyBindings";

function collectConnectorBindings(
  node: Extract<DiagramNodeV1, { type: "line" } | { type: "arrow" }>,
  paths: Set<string>,
): void {
  if (node.flowWhen?.path) {
    paths.add(node.flowWhen.path);
  }
  if (node.highlightWhen?.path) {
    paths.add(node.highlightWhen.path);
  }
}

function collectFromNode(node: DiagramNodeV1, paths: Set<string>): void {
  if (node.type === "rect") {
    collectNumericBinding(node.x, paths);
    collectNumericBinding(node.y, paths);
  } else if (node.type === "ellipse") {
    collectNumericBinding(node.cx, paths);
    collectNumericBinding(node.cy, paths);
  } else if (node.type === "text") {
    collectTextBinding(node.content, paths);
  } else if (node.type === "line" || node.type === "arrow") {
    collectConnectorBindings(node, paths);
  } else if (node.type === "group") {
    for (const child of node.children) {
      collectFromNode(child, paths);
    }
  }
}

function collectNumericBinding(
  prop: NumericPropV1 | undefined,
  paths: Set<string>,
): void {
  if (prop != null && typeof prop !== "number" && prop.binding?.path) {
    paths.add(prop.binding.path);
  }
}

function collectTextBinding(
  prop: string | { binding: DiagramBindingV1 },
  paths: Set<string>,
): void {
  if (typeof prop !== "string" && prop.binding?.path) {
    paths.add(prop.binding.path);
  }
}

function collectVec3Bindings(vec: Vec3PropV1 | undefined, paths: Set<string>): void {
  if (vec == null) {
    return;
  }
  collectNumericBinding(vec.x, paths);
  collectNumericBinding(vec.y, paths);
  collectNumericBinding(vec.z, paths);
}

function collectFrom3dNode(node: Diagram3dNodeV1, paths: Set<string>): void {
  if (node.type === "model") {
    collectVec3Bindings(node.position, paths);
    collectVec3Bindings(node.scale, paths);
    if (node.rotation != null && !Array.isArray(node.rotation)) {
      if (node.rotation.kind === "euler") {
        collectNumericBinding(node.rotation.pitch, paths);
        collectNumericBinding(node.rotation.yaw, paths);
        collectNumericBinding(node.rotation.roll, paths);
      } else if (node.rotation.kind === "quaternion") {
        paths.add(node.rotation.bindings.qw.path);
        paths.add(node.rotation.bindings.qx.path);
        paths.add(node.rotation.bindings.qy.path);
        paths.add(node.rotation.bindings.qz.path);
      }
    }
  } else if (node.type === "group3d") {
    for (const child of node.children) {
      collectFrom3dNode(child, paths);
    }
  }
}

function collectKonvaBinding(value: KonvaPropertyBindingValueV1, paths: Set<string>): void {
  if (isKonvaNumericPropertyBinding(value) && typeof value !== "number") {
    collectNumericBinding(value, paths);
    return;
  }
  if (isKonvaTextPropertyBinding(value)) {
    collectTextBinding(value, paths);
    return;
  }
  if (isKonvaGateBinding(value) && value.path) {
    paths.add(value.path);
  }
}

function collectFromKonvaFreeform(diagram: DiagramV1, paths: Set<string>): void {
  const bindings = diagram.freeform?.propertyBindings;
  if (bindings == null) {
    return;
  }
  for (const shapeBindings of Object.values(bindings)) {
    for (const spec of Object.values(shapeBindings)) {
      collectKonvaBinding(spec, paths);
    }
  }
}

export function collectDiagramBindingPaths(diagram: DiagramV1): string[] {
  const paths = new Set<string>();
  for (const node of diagram.nodes) {
    collectFromNode(node, paths);
  }
  for (const node of getDiagram3dNodes(diagram)) {
    collectFrom3dNode(node, paths);
  }
  collectFromKonvaFreeform(diagram, paths);
  return [...paths].sort();
}
