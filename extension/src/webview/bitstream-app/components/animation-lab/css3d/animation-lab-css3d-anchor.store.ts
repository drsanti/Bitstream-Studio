import * as THREE from "three";
import { create } from "zustand";

export type AnimationLabCss3dAnchorPositions = Record<string, THREE.Vector3>;

type AnimationLabCss3dAnchorStoreState = {
  positions: AnimationLabCss3dAnchorPositions;
  setPositions: (positions: AnimationLabCss3dAnchorPositions) => void;
  clearPositions: () => void;
};

export const useAnimationLabCss3dAnchorStore = create<AnimationLabCss3dAnchorStoreState>(
  (set) => ({
    positions: {},
    setPositions: (positions) => set({ positions }),
    clearPositions: () => set({ positions: {} }),
  }),
);
