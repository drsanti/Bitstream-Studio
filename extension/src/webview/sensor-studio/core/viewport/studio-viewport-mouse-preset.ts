import * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Scene3DConfigV1 } from "../scene3d/scene3d-config";

export type StudioViewportMousePreset = "three" | "blender";

export function applyStudioViewportMousePreset(
  controls: OrbitControls,
  scene3dControls: Scene3DConfigV1["controls"],
  preset: StudioViewportMousePreset,
): void {
  if (preset === "blender") {
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    controls.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;
    controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    return;
  }
  controls.mouseButtons.LEFT =
    scene3dControls.mouseButtons.left === "ROTATE"
      ? THREE.MOUSE.ROTATE
      : scene3dControls.mouseButtons.left === "DOLLY"
        ? THREE.MOUSE.DOLLY
        : THREE.MOUSE.PAN;
  controls.mouseButtons.MIDDLE =
    scene3dControls.mouseButtons.middle === "ROTATE"
      ? THREE.MOUSE.ROTATE
      : scene3dControls.mouseButtons.middle === "DOLLY"
        ? THREE.MOUSE.DOLLY
        : THREE.MOUSE.PAN;
  controls.mouseButtons.RIGHT =
    scene3dControls.mouseButtons.right === "ROTATE"
      ? THREE.MOUSE.ROTATE
      : scene3dControls.mouseButtons.right === "DOLLY"
        ? THREE.MOUSE.DOLLY
        : THREE.MOUSE.PAN;
  controls.touches.ONE =
    scene3dControls.touches.one === "PAN" ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
  controls.touches.TWO =
    scene3dControls.touches.two === "DOLLY_ROTATE"
      ? THREE.TOUCH.DOLLY_ROTATE
      : THREE.TOUCH.DOLLY_PAN;
}

/** Shift+MMB pans — remap middle button before OrbitControls handles pointerdown. */
export function bindStudioViewportBlenderShiftMiddlePan(
  domElement: HTMLElement,
  controls: OrbitControls,
): () => void {
  const onPointerDown = (event: PointerEvent) => {
    if (event.button === 1 && event.shiftKey) {
      controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
    }
  };

  const restoreMiddle = () => {
    controls.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;
  };

  domElement.addEventListener("pointerdown", onPointerDown, true);
  domElement.addEventListener("pointerup", restoreMiddle, true);
  domElement.addEventListener("pointercancel", restoreMiddle, true);
  return () => {
    domElement.removeEventListener("pointerdown", onPointerDown, true);
    domElement.removeEventListener("pointerup", restoreMiddle, true);
    domElement.removeEventListener("pointercancel", restoreMiddle, true);
  };
}
