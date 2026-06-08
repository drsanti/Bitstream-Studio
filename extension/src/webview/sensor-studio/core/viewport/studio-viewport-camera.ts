import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";
import type { Scene3DConfigV1 } from "../scene3d/scene3d-config";
import { computeOrthoZoomFromPerspectiveView } from "./studio-viewport-projection";

export type StudioViewportOrbitCamera =
  | THREE.PerspectiveCamera
  | THREE.OrthographicCamera;

export function cameraDriveKeyFromScene3d(s: Scene3DConfigV1): string {
  const { position, target } = s.camera.transform;
  return JSON.stringify({
    px: position.x,
    py: position.y,
    pz: position.z,
    tx: target.x,
    ty: target.y,
    tz: target.z,
  });
}

/** Fit orbit camera to a loaded model root (bounding sphere). */
export function frameStudioViewportCamera(params: {
  camera: StudioViewportOrbitCamera;
  controls: OrbitControls;
  object: THREE.Object3D;
  margin?: number;
  /** Used when `camera` is orthographic (no FOV on camera). */
  fovDeg?: number;
}): void {
  const margin = params.margin ?? 1.12;
  params.object.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(params.object);
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);

  const center = sphere.center.clone();
  const radius = Math.max(1e-4, sphere.radius);

  const fovDeg =
    params.camera instanceof THREE.PerspectiveCamera
      ? params.camera.fov
      : (params.fovDeg ?? 55);
  const fovRad = (fovDeg * Math.PI) / 180;
  const distance = (radius / Math.tan(fovRad / 2)) * margin;

  const dir = new THREE.Vector3(1, 0.7, 1).normalize();

  params.camera.position.copy(center).addScaledVector(dir, distance);
  params.camera.near = Math.max(0.01, distance / 200);
  params.camera.far = Math.max(params.camera.near + 1, distance * 200);

  if (params.camera instanceof THREE.PerspectiveCamera) {
    params.camera.updateProjectionMatrix();
  } else {
    const frustumHeight = params.camera.top - params.camera.bottom;
    params.camera.zoom = computeOrthoZoomFromPerspectiveView({
      distance,
      fovDeg,
      orthoFrustumHeight: frustumHeight,
    });
    params.camera.updateProjectionMatrix();
  }

  params.controls.target.copy(center);
  params.controls.update();
  params.camera.lookAt(center);
}

/** Restore orbit camera pose from committed `scene3d` (ignores GLB camera drives until next frame). */
export function resetStudioViewportCameraToScene3d(params: {
  camera: StudioViewportOrbitCamera;
  controls: OrbitControls;
  scene3d: Scene3DConfigV1;
}): string {
  const { camera, controls, scene3d } = params;
  const { position, target } = scene3d.camera.transform;
  camera.position.set(position.x, position.y, position.z);
  controls.target.set(target.x, target.y, target.z);
  controls.update();
  camera.lookAt(controls.target);
  if (camera instanceof THREE.OrthographicCamera) {
    const distance = camera.position.distanceTo(controls.target);
    const frustumHeight = camera.top - camera.bottom;
    camera.zoom = computeOrthoZoomFromPerspectiveView({
      distance,
      fovDeg: scene3d.camera.fovDeg,
      orthoFrustumHeight: frustumHeight,
    });
    camera.updateProjectionMatrix();
  }
  return cameraDriveKeyFromScene3d(scene3d);
}
