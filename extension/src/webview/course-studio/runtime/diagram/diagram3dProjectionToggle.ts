import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  computeOrthoZoomFromPerspectiveView,
  computePerspectiveDistanceFromOrthographicView,
  copyStudioViewportCameraPose,
  placePerspectiveCameraAtOrbitDistance,
  type StudioViewportProjectionMode,
} from "../../../sensor-studio/core/viewport/studio-viewport-projection";

/** Keep orbit framing when toggling perspective ↔ orthographic (Blender-style Numpad 5). */
export function applyDiagram3dViewportProjectionToggle(params: {
  mode: StudioViewportProjectionMode;
  previousMode: StudioViewportProjectionMode | null;
  controls: OrbitControlsImpl;
  perspective: THREE.PerspectiveCamera;
  orthographic: THREE.OrthographicCamera;
}): void {
  const { mode, previousMode, controls, perspective, orthographic } = params;
  const frustumHeight = orthographic.top - orthographic.bottom;

  if (mode === "orthographic") {
    const orbitDistance = controls.getDistance();
    copyStudioViewportCameraPose(perspective, orthographic);
    orthographic.zoom = computeOrthoZoomFromPerspectiveView({
      distance: orbitDistance,
      fovDeg: perspective.fov,
      orthoFrustumHeight: frustumHeight,
    });
    orthographic.updateProjectionMatrix();
    controls.object = orthographic;
    return;
  }

  if (previousMode === "orthographic") {
    const orthoZoom = orthographic.zoom;
    copyStudioViewportCameraPose(orthographic, perspective);
    const orbitDistance = computePerspectiveDistanceFromOrthographicView({
      orthoZoom,
      fovDeg: perspective.fov,
      orthoFrustumHeight: frustumHeight,
    });
    placePerspectiveCameraAtOrbitDistance({
      camera: perspective,
      target: controls.target,
      distance: orbitDistance,
    });
    controls.object = perspective;
    return;
  }

  controls.object = perspective;
}
