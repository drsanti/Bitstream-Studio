import { create } from "zustand";
import type { StudioViewportGizmoMode } from "../core/viewport/studio-viewport-gizmo-mode";
import type { StudioViewportMousePreset } from "../core/viewport/studio-viewport-mouse-preset";
import type { StudioViewportProjectionMode } from "../core/viewport/studio-viewport-projection";
import type { StudioViewportViewSnapMode } from "../core/viewport/studio-viewport-view-snaps";
import {
  readStoredStageViewportGizmoMode,
  readStoredStageViewportMousePreset,
  readStoredStageViewportOrthoZoom,
  readStoredStageViewportProjection,
  readStoredStageViewportViewSnapMode,
  writeStoredStageViewportGizmoMode,
  writeStoredStageViewportMousePreset,
  writeStoredStageViewportOrthoZoom,
  writeStoredStageViewportProjection,
  writeStoredStageViewportViewSnapMode,
} from "../features/stage/stage-viewport-navigation.persistence";

type StageViewportNavigationStore = {
  projection: StudioViewportProjectionMode;
  orthoZoom: number | null;
  mousePreset: StudioViewportMousePreset;
  viewSnapMode: StudioViewportViewSnapMode;
  gizmoMode: StudioViewportGizmoMode;
  setProjection: (mode: StudioViewportProjectionMode) => void;
  toggleProjection: () => void;
  setOrthoZoom: (zoom: number) => void;
  setMousePreset: (preset: StudioViewportMousePreset) => void;
  setViewSnapMode: (mode: StudioViewportViewSnapMode) => void;
  setGizmoMode: (mode: StudioViewportGizmoMode) => void;
};

export const useStageViewportNavigationStore = create<StageViewportNavigationStore>((set) => ({
  projection: readStoredStageViewportProjection(),
  orthoZoom: readStoredStageViewportOrthoZoom(),
  mousePreset: readStoredStageViewportMousePreset(),
  viewSnapMode: readStoredStageViewportViewSnapMode(),
  gizmoMode: readStoredStageViewportGizmoMode(),
  setProjection: (projection) => {
    writeStoredStageViewportProjection(projection);
    set({ projection });
  },
  toggleProjection: () => {
    set((state) => {
      const next = state.projection === "perspective" ? "orthographic" : "perspective";
      writeStoredStageViewportProjection(next);
      return { projection: next };
    });
  },
  setOrthoZoom: (orthoZoom) => {
    writeStoredStageViewportOrthoZoom(orthoZoom);
    set({ orthoZoom });
  },
  setMousePreset: (mousePreset) => {
    writeStoredStageViewportMousePreset(mousePreset);
    set({ mousePreset });
  },
  setViewSnapMode: (viewSnapMode) => {
    writeStoredStageViewportViewSnapMode(viewSnapMode);
    set({ viewSnapMode });
  },
  setGizmoMode: (gizmoMode) => {
    writeStoredStageViewportGizmoMode(gizmoMode);
    set({ gizmoMode });
  },
}));
