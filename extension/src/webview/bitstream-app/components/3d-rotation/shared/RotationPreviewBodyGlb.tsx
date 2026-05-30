import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import {
  ROTATION_PREVIEW_BODY_GLB_SCALE,
  ROTATION_PREVIEW_MIN_MATERIAL_ENV_MAP_INTENSITY,
} from "./rotationPreviewConstants.js";

function centerObject3dBoundingBoxAtOrigin(root: THREE.Object3D): void {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) {
    return;
  }
  const center = new THREE.Vector3();
  box.getCenter(center);
  root.position.sub(center);
  root.updateMatrixWorld(true);
}

/** Ensures Standard/Physical materials pick up `scene.environment` (many GLBs set intensity to 0). */
function ensureEnvMapIntensityForSceneEnvironment(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) {
      return;
    }
    const mats = Array.isArray(obj.material)
      ? obj.material
      : [obj.material];
    for (const mat of mats) {
      if (
        mat instanceof THREE.MeshStandardMaterial ||
        mat instanceof THREE.MeshPhysicalMaterial
      ) {
        if (mat.envMapIntensity < 0.001) {
          mat.envMapIntensity =
            ROTATION_PREVIEW_MIN_MATERIAL_ENV_MAP_INTENSITY;
        }
        mat.needsUpdate = true;
      }
    }
  });
}

/**
 * Loads an arbitrary GLB URL as the orientation preview body (centered at origin, env-aware).
 */
export function RotationPreviewBodyGlb({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.position.set(0, 0, 0);
    cloned.quaternion.identity();
    cloned.scale.set(1, 1, 1);
    centerObject3dBoundingBoxAtOrigin(cloned);
    ensureEnvMapIntensityForSceneEnvironment(cloned);
    return cloned;
  }, [scene]);
  return (
    <group scale={ROTATION_PREVIEW_BODY_GLB_SCALE}>
      <primitive object={clonedScene} />
    </group>
  );
}
