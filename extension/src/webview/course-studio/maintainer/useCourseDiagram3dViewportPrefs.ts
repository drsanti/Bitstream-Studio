import { create } from "zustand";
import type { StudioViewportProjectionMode } from "../../sensor-studio/core/viewport/studio-viewport-projection";
import type {
  Scene3dSelectionAppearancePrefs,
  Scene3dSelectionAppearancePresetId,
} from "../runtime/diagram/diagram3dSelectionAppearance";
import {
  applyScene3dSelectionPreset,
  markScene3dSelectionAppearanceCustom,
} from "../runtime/diagram/diagram3dSelectionAppearance";
import {
  clampCourseDiagram3dGizmoSize,
  readStoredCourseDiagram3dGizmoSize,
  readStoredCourseDiagram3dProjection,
  readStoredScene3dSelectionAppearance,
  writeStoredCourseDiagram3dGizmoSize,
  writeStoredCourseDiagram3dProjection,
  writeStoredScene3dSelectionAppearance,
} from "./course-diagram-3d-viewport.persistence";

type CourseDiagram3dViewportPrefsState = {
  gizmoSize: number;
  projection: StudioViewportProjectionMode;
  selectionAppearance: Scene3dSelectionAppearancePrefs;
  setGizmoSize: (size: number) => void;
  setProjection: (mode: StudioViewportProjectionMode) => void;
  toggleProjection: () => void;
  setSelectionAppearance: (prefs: Scene3dSelectionAppearancePrefs) => void;
  patchSelectionAppearance: (patch: Partial<Scene3dSelectionAppearancePrefs>) => void;
  applySelectionPreset: (presetId: Exclude<Scene3dSelectionAppearancePresetId, "custom">) => void;
};

function commitSelectionAppearance(
  prefs: Scene3dSelectionAppearancePrefs,
): Scene3dSelectionAppearancePrefs {
  writeStoredScene3dSelectionAppearance(prefs);
  return prefs;
}

export const useCourseDiagram3dViewportPrefs = create<CourseDiagram3dViewportPrefsState>(
  (set, get) => ({
    gizmoSize: readStoredCourseDiagram3dGizmoSize(),
    projection: readStoredCourseDiagram3dProjection(),
    selectionAppearance: readStoredScene3dSelectionAppearance(),
    setGizmoSize: (size) => {
      const next = clampCourseDiagram3dGizmoSize(size);
      writeStoredCourseDiagram3dGizmoSize(next);
      set({ gizmoSize: next });
    },
    setProjection: (mode) => {
      writeStoredCourseDiagram3dProjection(mode);
      set({ projection: mode });
    },
    toggleProjection: () => {
      const next =
        get().projection === "perspective" ? "orthographic" : "perspective";
      writeStoredCourseDiagram3dProjection(next);
      set({ projection: next });
    },
    setSelectionAppearance: (prefs) => {
      set({ selectionAppearance: commitSelectionAppearance(prefs) });
    },
    patchSelectionAppearance: (patch) => {
      const next = markScene3dSelectionAppearanceCustom({
        ...get().selectionAppearance,
        ...patch,
        ...(patch.selected != null
          ? { selected: { ...get().selectionAppearance.selected, ...patch.selected } }
          : {}),
        ...(patch.active != null
          ? { active: { ...get().selectionAppearance.active, ...patch.active } }
          : {}),
      });
      set({ selectionAppearance: commitSelectionAppearance(next) });
    },
    applySelectionPreset: (presetId) => {
      set({ selectionAppearance: commitSelectionAppearance(applyScene3dSelectionPreset(presetId)) });
    },
  }),
);
