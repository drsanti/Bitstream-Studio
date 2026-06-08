import { create } from "zustand";
import type { SceneObjectRefV1 } from "../core/stage/scene-object-ref";
import type { StageProceduralSpawnKind } from "../core/stage/stage-procedural-spawn-kind";
import type { StageWorkbenchMode } from "../core/stage/stage-workbench-mode";
import type { StageViewportPickDetail } from "../core/viewport/studio-viewport-stage-multi-models";
import type { FlowWireTransformV1 } from "../features/editor/nodes/transform/flow-wire-transform";
import {
  EMPTY_STAGE_SCENE_SNAPSHOT,
  type StageSceneSnapshotV1,
} from "../core/stage/stage-scene-snapshot";
import {
  readStoredStageWorkbenchMode,
  writeStoredStageWorkbenchMode,
} from "../features/stage/stage-workbench-mode.persistence";

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
  /** Last Stage viewport raycast pick (for Model Outliner sync). */
  lastViewportPick: StageViewportPickDetail | null;
  /** SE1 — committed Stage selection for inspector + highlight. */
  selectedSceneObject: SceneObjectRefV1 | null;
  /** SE4 — armed primitive; next Stage click spawns at hit point. */
  spawnPendingKind: StageProceduralSpawnKind | null;
  /** Edit = Stage authoring (gizmo, spawn). Simulate = graph eval drives the viewport. */
  workbenchMode: StageWorkbenchMode;
  /** Live gizmo overlay while dragging (Edit mode inspector mirror). */
  gizmoLiveObjectPath: string | null;
  gizmoLiveTransform: FlowWireTransformV1 | null;
  setWorkbenchMode: (mode: StageWorkbenchMode) => void;
  setGizmoLiveTransform: (args: {
    objectPath: string;
    transform: FlowWireTransformV1;
  }) => void;
  clearGizmoLiveTransform: () => void;
  setSnapshot: (snapshot: StageSceneSnapshotV1) => void;
  setPrimaryModelIndex: (index: number) => void;
  setLastViewportPick: (pick: StageViewportPickDetail | null) => void;
  setSelectedSceneObject: (ref: SceneObjectRefV1 | null) => void;
  setSpawnPendingKind: (kind: StageProceduralSpawnKind | null) => void;
  resetSnapshot: () => void;
};

const INITIAL_SNAPSHOT: StageSceneSnapshotV1 = {
  ...EMPTY_STAGE_SCENE_SNAPSHOT,
};

export const useStageSceneStore = create<StageSceneStore>((set) => ({
  snapshot: INITIAL_SNAPSHOT,
  primaryModelIndex: 0,
  lastViewportPick: null,
  selectedSceneObject: null,
  spawnPendingKind: null,
  workbenchMode: readStoredStageWorkbenchMode(),
  gizmoLiveObjectPath: null,
  gizmoLiveTransform: null,
  setWorkbenchMode: (workbenchMode) => {
    writeStoredStageWorkbenchMode(workbenchMode);
    set((state) => ({
      workbenchMode,
      spawnPendingKind: workbenchMode === "simulate" ? null : state.spawnPendingKind,
      gizmoLiveObjectPath: null,
      gizmoLiveTransform: null,
    }));
  },
  setGizmoLiveTransform: (args) =>
    set({
      gizmoLiveObjectPath: args.objectPath,
      gizmoLiveTransform: args.transform,
    }),
  clearGizmoLiveTransform: () =>
    set({
      gizmoLiveObjectPath: null,
      gizmoLiveTransform: null,
    }),
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
  setLastViewportPick: (pick) => set({ lastViewportPick: pick }),
  setSelectedSceneObject: (selectedSceneObject) =>
    set({
      selectedSceneObject,
      gizmoLiveObjectPath: null,
      gizmoLiveTransform: null,
    }),
  setSpawnPendingKind: (spawnPendingKind) => set({ spawnPendingKind }),
  resetSnapshot: () =>
    set({
      snapshot: INITIAL_SNAPSHOT,
      primaryModelIndex: 0,
      lastViewportPick: null,
      selectedSceneObject: null,
      spawnPendingKind: null,
      gizmoLiveObjectPath: null,
      gizmoLiveTransform: null,
    }),
}));
