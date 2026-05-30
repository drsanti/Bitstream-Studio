/*******************************************************************************
 * File Name : landingCss3dCamera.store.ts
 *
 * Description : R3F camera snapshot for CSS3DRenderer sync on the landing page.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import * as THREE from "three";
import { create } from "zustand";
import type { Camera } from "three";

export type LandingCss3dCameraSnapshot = {
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

export type LandingCss3dCameraStoreState = {
  snapshot: LandingCss3dCameraSnapshot | null;
  setSnapshot: (camera: Camera, width: number, height: number) => void;
  clearSnapshot: () => void;
};

/**
 * Updated each frame by {@link LandingCss3dCameraSync} inside the backdrop Canvas.
 */
export const useLandingCss3dCameraStore = create<LandingCss3dCameraStoreState>((set) => ({
  snapshot: null,

  setSnapshot: (camera, width, height) =>
  {
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

  clearSnapshot: () =>
  {
    set({ snapshot: null });
  },
}));
