import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";
import type { Scene3DConfigV1 } from "../scene3d/scene3d-config";

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
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  object: THREE.Object3D;
  margin?: number;
}): void {
  const margin = params.margin ?? 1.12;
  params.object.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(params.object);
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);

  const center = sphere.center.clone();
  const radius = Math.max(1e-4, sphere.radius);

  const fovRad = (params.camera.fov * Math.PI) / 180;
  const distance = (radius / Math.tan(fovRad / 2)) * margin;

  const dir = new THREE.Vector3(1, 0.7, 1).normalize();

  params.camera.position.copy(center).addScaledVector(dir, distance);
  params.camera.near = Math.max(0.01, distance / 200);
  params.camera.far = Math.max(params.camera.near + 1, distance * 200);
  params.camera.updateProjectionMatrix();

  params.controls.target.copy(center);
  params.controls.update();
  params.camera.lookAt(center);
}

/** Restore orbit camera pose from committed `scene3d` (ignores GLB camera drives until next frame). */
export function resetStudioViewportCameraToScene3d(params: {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  scene3d: Scene3DConfigV1;
}): string {
  const { camera, controls, scene3d } = params;
  const { position, target } = scene3d.camera.transform;
  camera.position.set(position.x, position.y, position.z);
  controls.target.set(target.x, target.y, target.z);
  controls.update();
  camera.lookAt(controls.target);
  return cameraDriveKeyFromScene3d(scene3d);
}
