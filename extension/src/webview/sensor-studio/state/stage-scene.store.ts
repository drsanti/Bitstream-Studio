import { create } from "zustand";
import {
  EMPTY_STAGE_SCENE_SNAPSHOT,
  type StageSceneSnapshotV1,
} from "../core/stage/stage-scene-snapshot";

function clampPrimaryModelIndex(index: number, modelCount: number): number {
  if (modelCount <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(index, modelCount - 1));
}

type StageSceneStore = {
  snapshot: StageSceneSnapshotV1;
  /** Which wired model entry the Stage viewport renders (UI-only; not in graph snapshot). */
  primaryModelIndex: number;
  setSnapshot: (snapshot: StageSceneSnapshotV1) => void;
  setPrimaryModelIndex: (index: number) => void;
  resetSnapshot: () => void;
};

const INITIAL_SNAPSHOT: StageSceneSnapshotV1 = {
  ...EMPTY_STAGE_SCENE_SNAPSHOT,
};

export const useStageSceneStore = create<StageSceneStore>((set) => ({
  snapshot: INITIAL_SNAPSHOT,
  primaryModelIndex: 0,
  setSnapshot: (snapshot) =>
    set((state) => ({
      snapshot,
      primaryModelIndex: clampPrimaryModelIndex(
        state.primaryModelIndex,
        snapshot.models.length,
      ),
    })),
  setPrimaryModelIndex: (index) =>
    set((state) => ({
      primaryModelIndex: clampPrimaryModelIndex(index, state.snapshot.models.length),
    })),
  resetSnapshot: () => set({ snapshot: INITIAL_SNAPSHOT, primaryModelIndex: 0 }),
}));
