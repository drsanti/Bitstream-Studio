/**
 * Three.js shadow wiring for the rotation preview (studio directionals + loaded GLB).
 * Keeps helper objects out of shadow maps and centralizes orthographic shadow tuning.
 */
import * as THREE from "three";
import type { Scene3DConfigV1 } from "./scene3d-config";
import { DEFAULT_SCENE3D_CONFIG_V1 } from "./scene3d-config";

const RD = DEFAULT_SCENE3D_CONFIG_V1.renderer;

/** Resolved shadow knobs after defaults (matches coerced `scene3d`, safe for raw-ish refs). */
export function resolveStudioShadowParams(s: Scene3DConfigV1): {
  enabled: boolean;
  mapSize: number;
  orthoExtent: number;
  bias: number;
  normalBias: number;
} {
  const r = s.renderer;
  return {
    enabled: r.shadowsEnabled === true,
    mapSize:
      typeof r.shadowMapSize === "number" && Number.isFinite(r.shadowMapSize)
        ? r.shadowMapSize
        : RD.shadowMapSize,
    orthoExtent:
      typeof r.shadowOrthoExtent === "number" && Number.isFinite(r.shadowOrthoExtent)
        ? r.shadowOrthoExtent
        : RD.shadowOrthoExtent,
    bias:
      typeof r.shadowBias === "number" && Number.isFinite(r.shadowBias) ? r.shadowBias : RD.shadowBias,
    normalBias:
      typeof r.shadowNormalBias === "number" && Number.isFinite(r.shadowNormalBias)
        ? r.shadowNormalBias
        : RD.shadowNormalBias,
  };
}

export function studioShadowPipelineKey(parts: {
  enabled: boolean;
  mapSize: number;
  orthoExtent: number;
  bias: number;
  normalBias: number;
  directionalShadowGeneration: number;
}): string {
  const { enabled, mapSize, orthoExtent, bias, normalBias, directionalShadowGeneration } = parts;
  return `${enabled}|${mapSize}|${orthoExtent}|${bias}|${normalBias}|${directionalShadowGeneration}`;
}

export function disableShadowOnObjectSubtree(root: THREE.Object3D): void {
  root.traverse((obj) => {
    obj.castShadow = false;
    obj.receiveShadow = false;
  });
}

export function configureStudioDirectionalShadow(
  dl: THREE.DirectionalLight,
  enabled: boolean,
  mapSize: number,
  orthoHalfExtent: number,
  shadowBias: number,
  shadowNormalBias: number,
): void {
  dl.castShadow = enabled;
  if (!enabled) {
    return;
  }
  const dim = THREE.MathUtils.floorPowerOfTwo(Math.min(4096, Math.max(512, mapSize)));
  dl.shadow.mapSize.width = dim;
  dl.shadow.mapSize.height = dim;
  dl.shadow.bias = shadowBias;
  dl.shadow.normalBias = shadowNormalBias;
  const cam = dl.shadow.camera as THREE.OrthographicCamera;
  cam.near = 0.2;
  cam.far = Math.max(orthoHalfExtent * 6, 80);
  const extent = orthoHalfExtent;
  cam.left = -extent;
  cam.right = extent;
  cam.top = extent;
  cam.bottom = -extent;
  cam.updateProjectionMatrix();
}

export function applyStudioShadowMeshes(root: THREE.Object3D | null, enabled: boolean): void {
  if (root == null) {
    return;
  }
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh & { isMesh?: boolean };
    if (mesh.isMesh !== true) {
      return;
    }
    mesh.castShadow = enabled;
    mesh.receiveShadow = enabled;
  });
}
