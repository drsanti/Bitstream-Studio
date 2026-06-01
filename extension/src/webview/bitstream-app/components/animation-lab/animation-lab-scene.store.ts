import * as THREE from "three";
import { create } from "zustand";

type AnimationLabSceneStoreState = {
  root: THREE.Object3D | null;
  setRoot: (root: THREE.Object3D | null) => void;
};

export const useAnimationLabSceneStore = create<AnimationLabSceneStoreState>((set) => ({
  root: null,
  setRoot: (root) => set({ root }),
}));
