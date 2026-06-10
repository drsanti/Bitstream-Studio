import type { Object3D } from "three";
import type { ResolvedRotation3d } from "./evaluateDiagram3dProps";

export function applyResolvedRotationToObject3D(
  object: Object3D,
  rotation: ResolvedRotation3d,
): void {
  if (rotation.kind === "quaternion") {
    object.quaternion.set(rotation.qx, rotation.qy, rotation.qz, rotation.qw);
    return;
  }
  if (rotation.kind === "euler") {
    object.rotation.set(
      (rotation.pitch * Math.PI) / 180,
      (rotation.yaw * Math.PI) / 180,
      (rotation.roll * Math.PI) / 180,
    );
  }
}
