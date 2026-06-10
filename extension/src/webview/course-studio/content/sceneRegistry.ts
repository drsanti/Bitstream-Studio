import { useShallow } from "zustand/react/shallow";
import { parseSceneV1, type SceneV1 } from "../schemas/scene.v1";
import { useCourseSceneEditorStore } from "../maintainer/useCourseSceneEditorStore";
import { getActiveCoursePackOverlay } from "./presentationPackLoad";
import pilotBmiPcbSceneJson from "./pilot-bmi-pcb-orientation.scene.v1.json";

export const PILOT_BMI_PCB_SCENE_SOURCE_PATH =
  "src/webview/course-studio/content/pilot-bmi-pcb-orientation.scene.v1.json";

const BUNDLED_SCENES: Record<string, SceneV1> = {
  "pilot-bmi-pcb-orientation": parseSceneV1(pilotBmiPcbSceneJson),
};

const SCENE_SOURCE_PATHS: Record<string, string> = {
  "pilot-bmi-pcb-orientation": PILOT_BMI_PCB_SCENE_SOURCE_PATH,
};

function resolveBundledScene(documentId: string): SceneV1 | null {
  const overlay = getActiveCoursePackOverlay();
  const overlayScene = overlay?.scenes[documentId];
  if (overlayScene != null) {
    return overlayScene.scene;
  }
  return BUNDLED_SCENES[documentId] ?? null;
}

export function loadCourseScene(documentId: string): SceneV1 | null {
  const draft = useCourseSceneEditorStore.getState().drafts[documentId];
  if (draft != null) {
    return draft;
  }
  return resolveBundledScene(documentId);
}

export function registerCourseScene(scene: SceneV1, sourcePath: string): void {
  useCourseSceneEditorStore.getState().initScene(scene, sourcePath);
}

export function getCourseSceneSourcePath(documentId: string): string | undefined {
  const fromStore = useCourseSceneEditorStore.getState().sourcePaths[documentId];
  if (fromStore != null) {
    return fromStore;
  }
  const overlay = getActiveCoursePackOverlay();
  const overlayScene = overlay?.scenes[documentId];
  if (overlayScene != null) {
    return overlayScene.sourcePath;
  }
  return SCENE_SOURCE_PATHS[documentId];
}

export function useCourseSceneIds(): string[] {
  return useCourseSceneEditorStore(useShallow((s) => Object.keys(s.drafts).sort()));
}

export function ensureCourseSceneDraft(documentId: string): boolean {
  const { drafts, initScene } = useCourseSceneEditorStore.getState();
  if (drafts[documentId] != null) {
    return true;
  }
  const scene = resolveBundledScene(documentId);
  const sourcePath = getCourseSceneSourcePath(documentId);
  if (scene == null || sourcePath == null) {
    return false;
  }
  initScene(scene, sourcePath);
  return true;
}

export const COURSE_SCENE_IDS = Object.keys(BUNDLED_SCENES);

export function initCourseSceneRegistryFromPack(): void {
  initCourseSceneRegistryRespectingOverlay();
}

export function initCourseSceneRegistryRespectingOverlay(): void {
  const overlay = getActiveCoursePackOverlay();
  const { initScene } = useCourseSceneEditorStore.getState();

  if (overlay == null) {
    for (const id of COURSE_SCENE_IDS) {
      const scene = BUNDLED_SCENES[id];
      const sourcePath = SCENE_SOURCE_PATHS[id];
      if (scene != null && sourcePath != null) {
        initScene(scene, sourcePath);
      }
    }
    return;
  }

  for (const entry of Object.values(overlay.scenes)) {
    initScene(entry.scene, entry.sourcePath);
  }

  for (const id of COURSE_SCENE_IDS) {
    if (overlay.scenes[id] != null) {
      continue;
    }
    const scene = BUNDLED_SCENES[id];
    const sourcePath = SCENE_SOURCE_PATHS[id];
    if (scene != null && sourcePath != null) {
      initScene(scene, sourcePath);
    }
  }
}

export function isCourseSceneReadOnly(documentId: string): boolean {
  const overlay = getActiveCoursePackOverlay();
  if (overlay?.scenes[documentId] != null && BUNDLED_SCENES[documentId] == null) {
    return overlay.readOnly;
  }
  const sourcePath = getCourseSceneSourcePath(documentId);
  return sourcePath?.startsWith("pack:") ?? false;
}
