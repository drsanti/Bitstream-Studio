import * as THREE from "three";
import { create } from "zustand";
import type { Camera } from "three";

export type AnimationLabCss3dCameraSnapshot = {
  fov: number;
  aspect: number;
  near: number;
  far: number;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  projectionMatrix: THREE.Matrix4;
  matrixWorldInverse: THREE.Matrix4;
  width: number;
  height: number;
};

type AnimationLabCss3dCameraStoreState = {
  snapshot: AnimationLabCss3dCameraSnapshot | null;
  setSnapshot: (camera: Camera, width: number, height: number) => void;
  clearSnapshot: () => void;
};

export const useAnimationLabCss3dCameraStore = create<AnimationLabCss3dCameraStoreState>(
  (set) => ({
    snapshot: null,
    setSnapshot: (camera, width, height) => {
      camera.updateMatrixWorld(true);
      const perspective = camera as THREE.PerspectiveCamera;
      set({
        snapshot: {
          fov: perspective.fov,
          aspect: width / Math.max(height, 1),
          near: perspective.near,
          far: perspective.far,
          position: camera.position.clone(),
          quaternion: camera.quaternion.clone(),
          projectionMatrix: camera.projectionMatrix.clone(),
          matrixWorldInverse: camera.matrixWorldInverse.clone(),
          width,
          height,
        },
      });
    },
    clearSnapshot: () => set({ snapshot: null }),
  }),
);
