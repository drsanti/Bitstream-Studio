import type { Diagram3dNodeV1, NumericPropV1 } from "../../schemas/diagram.v1";
import { getDiagram3dLayer } from "../../schemas/normalizeDiagramV1";
import type { SceneV1 } from "../../schemas/scene.v1";
import { sceneV1ToDiagramV1 } from "./sceneDiagramBridge";

function numericPropHasBinding(prop: NumericPropV1 | undefined): boolean {
  return prop != null && typeof prop !== "number" && prop.binding?.path != null;
}

function vec3HasBinding(vec: { x?: NumericPropV1; y?: NumericPropV1; z?: NumericPropV1 } | undefined): boolean {
  if (vec == null) {
    return false;
  }
  return numericPropHasBinding(vec.x) || numericPropHasBinding(vec.y) || numericPropHasBinding(vec.z);
}

function rotationHasBinding(rotation: Diagram3dNodeV1["rotation"]): boolean {
  if (rotation == null || Array.isArray(rotation)) {
    return false;
  }
  if (rotation.kind === "quaternion") {
    return (
      rotation.bindings.qw.path != null ||
      rotation.bindings.qx.path != null ||
      rotation.bindings.qy.path != null ||
      rotation.bindings.qz.path != null
    );
  }
  return (
    numericPropHasBinding(rotation.pitch) ||
    numericPropHasBinding(rotation.yaw) ||
    numericPropHasBinding(rotation.roll)
  );
}

function nodeHasLiveBinding(node: Diagram3dNodeV1): boolean {
  if (rotationHasBinding(node.rotation)) {
    return true;
  }
  return vec3HasBinding(node.position) || vec3HasBinding(node.scale);
}

function walkDiagram3dNodes(nodes: Diagram3dNodeV1[]): boolean {
  for (const node of nodes) {
    if (nodeHasLiveBinding(node)) {
      return true;
    }
    if (node.type === "group3d" && walkDiagram3dNodes(node.children)) {
      return true;
    }
  }
  return false;
}

/** True when any scene node uses live telemetry bindings (rotation, position, or scale). */
export function sceneUsesLiveBinding(scene: SceneV1): boolean {
  const layer = getDiagram3dLayer(sceneV1ToDiagramV1(scene));
  if (layer == null) {
    return false;
  }
  return walkDiagram3dNodes(layer.nodes);
}
