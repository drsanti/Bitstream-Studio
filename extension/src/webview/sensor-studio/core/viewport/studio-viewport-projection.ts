import * as THREE from "three";

export type StudioViewportProjectionMode = "perspective" | "orthographic";

/** Default ortho frustum height (world units) at zoom = 1 — matches `top - bottom`. */
export const STUDIO_VIEWPORT_ORTHO_FRUSTUM_HEIGHT = 2;

export function createStudioViewportOrthographicCamera(
  aspect: number,
  near = 0.01,
  far = 2000,
): THREE.OrthographicCamera {
  const frustumHeight = STUDIO_VIEWPORT_ORTHO_FRUSTUM_HEIGHT;
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

export function updateStudioViewportOrthographicCameraAspect(
  camera: THREE.OrthographicCamera,
  aspect: number,
): void {
  const frustumHeight = STUDIO_VIEWPORT_ORTHO_FRUSTUM_HEIGHT;
  const frustumWidth = frustumHeight * aspect;
  camera.left = -frustumWidth / 2;
  camera.right = frustumWidth / 2;
  camera.top = frustumHeight / 2;
  camera.bottom = -frustumHeight / 2;
  camera.updateProjectionMatrix();
}

/** Match perspective orbit framing with an orthographic zoom factor. */
export function computeOrthoZoomFromPerspectiveView(params: {
  distance: number;
  fovDeg: number;
  orthoFrustumHeight?: number;
}): number {
  const { distance, fovDeg, orthoFrustumHeight = STUDIO_VIEWPORT_ORTHO_FRUSTUM_HEIGHT } =
    params;
  const fovRad = (fovDeg * Math.PI) / 180;
  const visibleHeight = 2 * Math.max(1e-6, distance) * Math.tan(fovRad / 2);
  return orthoFrustumHeight / visibleHeight;
}

export function applyOrthoZoomFromPerspectiveView(
  ortho: THREE.OrthographicCamera,
  params: {
    distance: number;
    fovDeg: number;
    storedZoom?: number | null;
  },
): number {
  const zoom =
    params.storedZoom != null &&
    Number.isFinite(params.storedZoom) &&
    params.storedZoom > 0
      ? params.storedZoom
      : computeOrthoZoomFromPerspectiveView({
          distance: params.distance,
          fovDeg: params.fovDeg,
          orthoFrustumHeight: ortho.top - ortho.bottom,
        });
  ortho.zoom = zoom;
  ortho.updateProjectionMatrix();
  return zoom;
}

export function copyStudioViewportCameraPose(
  from: THREE.Camera,
  to: THREE.Camera,
): void {
  to.position.copy(from.position);
  to.quaternion.copy(from.quaternion);
  to.near = from.near;
  to.far = from.far;
  to.updateMatrixWorld(true);
}
