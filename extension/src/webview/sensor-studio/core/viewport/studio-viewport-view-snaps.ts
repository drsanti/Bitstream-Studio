import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";
import type { StudioViewportOrbitCamera } from "./studio-viewport-camera";

export type StudioViewportViewSnapMode = "camera-relative" | "world-locked";

export type StudioViewportViewSnapId =
  | "front"
  | "right"
  | "top"
  | "back"
  | "left"
  | "bottom";

const WORLD_VIEW_DIRS: Record<StudioViewportViewSnapId, THREE.Vector3> = {
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1),
  right: new THREE.Vector3(1, 0, 0),
  left: new THREE.Vector3(-1, 0, 0),
  top: new THREE.Vector3(0, 1, 0),
  bottom: new THREE.Vector3(0, -1, 0),
};

const OPPOSITE_SNAP: Partial<Record<StudioViewportViewSnapId, StudioViewportViewSnapId>> =
  {
    front: "back",
    back: "front",
    right: "left",
    left: "right",
    top: "bottom",
    bottom: "top",
  };

/** Numpad 9 → opposite of the primary axis snap (Blender-style). */
export function oppositeStudioViewportViewSnap(
  snap: StudioViewportViewSnapId,
): StudioViewportViewSnapId {
  return OPPOSITE_SNAP[snap] ?? "back";
}

function viewDirectionForSnap(
  camera: THREE.Camera,
  snap: StudioViewportViewSnapId,
  mode: StudioViewportViewSnapMode,
): THREE.Vector3 {
  if (mode === "world-locked") {
    return WORLD_VIEW_DIRS[snap].clone();
  }
  camera.updateMatrixWorld(true);
  const basisRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const basisUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  const basisForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  switch (snap) {
    case "front":
      return basisForward.clone().negate();
    case "back":
      return basisForward.clone();
    case "right":
      return basisRight.clone();
    case "left":
      return basisRight.clone().negate();
    case "top":
      return basisUp.clone();
    case "bottom":
      return basisUp.clone().negate();
    default: {
      const _x: never = snap;
      return _x;
    }
  }
}

function upVectorForSnap(
  snap: StudioViewportViewSnapId,
  mode: StudioViewportViewSnapMode,
): THREE.Vector3 {
  if (mode === "world-locked") {
    if (snap === "top") {
      return new THREE.Vector3(0, 0, -1);
    }
    if (snap === "bottom") {
      return new THREE.Vector3(0, 0, 1);
    }
    return new THREE.Vector3(0, 1, 0);
  }
  if (snap === "top" || snap === "bottom") {
    return new THREE.Vector3(0, 0, -1);
  }
  return new THREE.Vector3(0, 1, 0);
}

/** Snap orbit camera to a cardinal view while preserving target distance. */
export function snapStudioViewportOrbitToView(params: {
  camera: StudioViewportOrbitCamera;
  controls: OrbitControls;
  snap: StudioViewportViewSnapId;
  mode: StudioViewportViewSnapMode;
}): void {
  const { camera, controls, snap, mode } = params;
  const target = controls.target;
  const offset = new THREE.Vector3().subVectors(camera.position, target);
  const distance = Math.max(1e-4, offset.length());
  const dir = viewDirectionForSnap(camera, snap, mode).normalize();
  camera.position.copy(target).addScaledVector(dir, distance);
  camera.up.copy(upVectorForSnap(snap, mode));
  camera.lookAt(target);
  camera.updateMatrixWorld(true);
  controls.update();
}
