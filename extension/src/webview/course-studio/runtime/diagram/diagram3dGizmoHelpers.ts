import type { Object3D } from "three";
import type { Diagram3dRotationV1 } from "../../schemas/diagram.v1";
import { roundDiagram3dPositionComponent } from "./diagram3dPositionSnap";

export type Diagram3dTransformGizmoMode = "translate" | "rotate" | "scale";

export const DIAGRAM_3D_GIZMO_MODES: readonly Diagram3dTransformGizmoMode[] = [
  "translate",
  "rotate",
  "scale",
] as const;

export function isDiagram3dTransformGizmoMode(v: unknown): v is Diagram3dTransformGizmoMode {
  return v === "translate" || v === "rotate" || v === "scale";
}

/** Rotate gizmo writes static euler — not compatible with live quaternion/euler bindings. */
export function canDiagram3dNodeUseRotateGizmo(rotation: Diagram3dRotationV1 | undefined | null): boolean {
  if (rotation == null) {
    return true;
  }
  if (Array.isArray(rotation)) {
    return true;
  }
  return false;
}

export function readEulerDegreesFromObject3D(object: Object3D): [number, number, number] {
  const pitch = roundDiagram3dPositionComponent((object.rotation.x * 180) / Math.PI, 2);
  const yaw = roundDiagram3dPositionComponent((object.rotation.y * 180) / Math.PI, 2);
  const roll = roundDiagram3dPositionComponent((object.rotation.z * 180) / Math.PI, 2);
  return [pitch, yaw, roll];
}

export function readScaleFromObject3D(object: Object3D): [number, number, number] {
  return [
    roundDiagram3dPositionComponent(object.scale.x, 3),
    roundDiagram3dPositionComponent(object.scale.y, 3),
    roundDiagram3dPositionComponent(object.scale.z, 3),
  ];
}
