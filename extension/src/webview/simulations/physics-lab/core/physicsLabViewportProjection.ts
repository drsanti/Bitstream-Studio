import * as THREE from "three";

export type PhysicsLabProjectionMode = "perspective" | "orthographic";

export const PHYSICS_LAB_ORTHO_FRUSTUM_HEIGHT = 2;

export function createPhysicsLabOrthographicCamera(
  aspect: number,
  near = 0.01,
  far = 2000,
): THREE.OrthographicCamera {
  const frustumHeight = PHYSICS_LAB_ORTHO_FRUSTUM_HEIGHT;
  const frustumWidth = frustumHeight * aspect;
  const cam = new THREE.OrthographicCamera(
    -frustumWidth / 2,
    frustumWidth / 2,
    frustumHeight / 2,
    -frustumHeight / 2,
    near,
    far,
  );
  cam.zoom = 1;
  cam.updateProjectionMatrix();
  return cam;
}

export function updatePhysicsLabOrthographicCameraAspect(
  camera: THREE.OrthographicCamera,
  aspect: number,
): void {
  const frustumHeight = PHYSICS_LAB_ORTHO_FRUSTUM_HEIGHT;
  const frustumWidth = frustumHeight * aspect;
  camera.left = -frustumWidth / 2;
  camera.right = frustumWidth / 2;
  camera.top = frustumHeight / 2;
  camera.bottom = -frustumHeight / 2;
  camera.updateProjectionMatrix();
}

export function computeOrthoZoomFromPerspectiveView(params: {
  distance: number;
  fovDeg: number;
  orthoFrustumHeight?: number;
}): number {
  const { distance, fovDeg, orthoFrustumHeight = PHYSICS_LAB_ORTHO_FRUSTUM_HEIGHT } = params;
  const fovRad = (fovDeg * Math.PI) / 180;
  const visibleHeight = 2 * Math.max(1e-6, distance) * Math.tan(fovRad / 2);
  return orthoFrustumHeight / visibleHeight;
}

export function computePerspectiveDistanceFromOrthographicView(params: {
  orthoZoom: number;
  fovDeg: number;
  orthoFrustumHeight?: number;
}): number {
  const { orthoZoom, fovDeg, orthoFrustumHeight = PHYSICS_LAB_ORTHO_FRUSTUM_HEIGHT } = params;
  const visibleHeight = orthoFrustumHeight / Math.max(1e-6, orthoZoom);
  const fovRad = (fovDeg * Math.PI) / 180;
  return visibleHeight / (2 * Math.tan(fovRad / 2));
}

export function placePerspectiveCameraAtOrbitDistance(params: {
  camera: THREE.PerspectiveCamera;
  target: THREE.Vector3;
  distance: number;
}): void {
  const { camera, target, distance } = params;
  const offset = new THREE.Vector3().subVectors(camera.position, target);
  if (offset.lengthSq() < 1e-12) {
    offset.set(0, 0, 1);
  } else {
    offset.normalize();
  }
  offset.multiplyScalar(Math.max(1e-6, distance));
  camera.position.copy(target).add(offset);
  camera.updateProjectionMatrix();
}

export function copyPhysicsLabCameraPose(from: THREE.Camera, to: THREE.Camera): void {
  to.position.copy(from.position);
  to.quaternion.copy(from.quaternion);
  to.near = from.near;
  to.far = from.far;
  to.updateMatrixWorld(true);
}

export function applyPhysicsLabProjectionToggle(params: {
  mode: PhysicsLabProjectionMode;
  previousMode: PhysicsLabProjectionMode | null;
  controls: { getDistance: () => number; object: THREE.Camera; target: THREE.Vector3; update: () => void };
  perspective: THREE.PerspectiveCamera;
  orthographic: THREE.OrthographicCamera;
}): void {
  const { mode, previousMode, controls, perspective, orthographic } = params;
  const frustumHeight = orthographic.top - orthographic.bottom;

  if (mode === "orthographic") {
    const orbitDistance = controls.getDistance();
    copyPhysicsLabCameraPose(perspective, orthographic);
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
    copyPhysicsLabCameraPose(orthographic, perspective);
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
