import { useShallow } from "zustand/react/shallow";
import { readKonvaCanvasBackground } from "../maintainer/courseKonvaTheme";
import { useCourseDiagramEditorStore } from "../maintainer/useCourseDiagramEditorStore";
import { parseDiagramV1, type DiagramV1 } from "../schemas/diagram.v1";
import { getActiveCoursePackOverlay } from "./presentationPackLoad";
import pilotMemsDiagramJson from "./pilot-bmi-accel-mems.diagram.v1.json";
import pilotOrientation3dDiagramJson from "./pilot-bmi-orientation-3d.diagram.v1.json";

export const PILOT_MEMS_DIAGRAM_SOURCE_PATH =
  "src/webview/course-studio/content/pilot-bmi-accel-mems.diagram.v1.json";

export const PILOT_ORIENTATION_3D_DIAGRAM_SOURCE_PATH =
  "src/webview/course-studio/content/pilot-bmi-orientation-3d.diagram.v1.json";

const BUNDLED_DIAGRAMS: Record<string, DiagramV1> = {
  "pilot-bmi-accel-mems": parseDiagramV1(pilotMemsDiagramJson),
  "pilot-bmi-orientation-3d": parseDiagramV1(pilotOrientation3dDiagramJson),
};

const DIAGRAM_SOURCE_PATHS: Record<string, string> = {
  "pilot-bmi-accel-mems": PILOT_MEMS_DIAGRAM_SOURCE_PATH,
  "pilot-bmi-orientation-3d": PILOT_ORIENTATION_3D_DIAGRAM_SOURCE_PATH,
};

function resolveBundledDiagram(diagramId: string): DiagramV1 | null {
  const overlay = getActiveCoursePackOverlay();
  const overlayDiagram = overlay?.diagrams[diagramId];
  if (overlayDiagram != null) {
    return overlayDiagram.diagram;
  }
  return BUNDLED_DIAGRAMS[diagramId] ?? null;
}

export function loadCourseDiagram(diagramId: string): DiagramV1 | null {
  const draft = useCourseDiagramEditorStore.getState().drafts[diagramId];
  if (draft != null) {
    return draft;
  }
  return resolveBundledDiagram(diagramId);
}

/** Ensures a maintainer draft exists before diagram mutations (e.g. enable 3D layer). */
export function ensureCourseDiagramDraft(diagramId: string): boolean {
  const store = useCourseDiagramEditorStore.getState();
  if (store.drafts[diagramId] != null) {
    return true;
  }
  const diagram = resolveBundledDiagram(diagramId);
  const sourcePath = getCourseDiagramSourcePath(diagramId);
  if (diagram == null || sourcePath == null) {
    return false;
  }
  store.initDiagram(diagram, sourcePath);
  return true;
}

export function getCourseDiagramSourcePath(diagramId: string): string | null {
  const overlay = getActiveCoursePackOverlay();
  const overlayDiagram = overlay?.diagrams[diagramId];
  if (overlayDiagram != null) {
    return overlayDiagram.sourcePath;
  }
  return DIAGRAM_SOURCE_PATHS[diagramId] ?? null;
}

export const COURSE_DIAGRAM_IDS = Object.keys(BUNDLED_DIAGRAMS);

/** All diagram ids with an in-memory draft (bundled + session-created). */
export function useCourseDiagramIds(): string[] {
  return useCourseDiagramEditorStore(useShallow((s) => Object.keys(s.drafts).sort()));
}

/** Register a dev- or session-created diagram (not shipped in the VSIX bundle). */
export function registerCourseDiagram(diagram: DiagramV1, sourcePath: string): void {
  useCourseDiagramEditorStore.getState().initDiagram(diagram, sourcePath);
}

export function initCourseDiagramRegistryFromPack(): void {
  initCourseDiagramRegistryRespectingOverlay();
}

export function initCourseDiagramRegistryRespectingOverlay(): void {
  const overlay = getActiveCoursePackOverlay();
  const { initDiagram } = useCourseDiagramEditorStore.getState();

  if (overlay == null) {
    for (const id of COURSE_DIAGRAM_IDS) {
      const diagram = BUNDLED_DIAGRAMS[id];
      const sourcePath = DIAGRAM_SOURCE_PATHS[id];
      if (diagram != null && sourcePath != null) {
        initDiagram(diagram, sourcePath);
      }
    }
    return;
  }

  for (const entry of Object.values(overlay.diagrams)) {
    initDiagram(entry.diagram, entry.sourcePath);
  }

  for (const id of COURSE_DIAGRAM_IDS) {
    if (overlay.diagrams[id] != null) {
      continue;
    }
    const diagram = BUNDLED_DIAGRAMS[id];
    const sourcePath = DIAGRAM_SOURCE_PATHS[id];
    if (diagram != null && sourcePath != null) {
      initDiagram(diagram, sourcePath);
    }
  }
}

/** @deprecated Use initCourseDiagramRegistryRespectingOverlay */
export function initBundledCourseDiagrams(): void {
  initCourseDiagramRegistryRespectingOverlay();
}

/** React hook — prefers maintainer draft, then pack overlay, then bundled JSON. */
export function useCourseDiagram(diagramId: string): DiagramV1 | null {
  const draft = useCourseDiagramEditorStore((s) => s.drafts[diagramId]);
  if (draft != null) {
    return draft;
  }
  return resolveBundledDiagram(diagramId);
}

/** Konva canvas background for a diagram block — tracks maintainer drafts. */
export function useKonvaCanvasBackground(diagramId: string): string | null {
  const diagram = useCourseDiagram(diagramId);
  return readKonvaCanvasBackground(diagram);
}

export function isCourseDiagramReadOnly(diagramId: string): boolean {
  const overlay = getActiveCoursePackOverlay();
  if (overlay?.diagrams[diagramId] != null && BUNDLED_DIAGRAMS[diagramId] == null) {
    return overlay.readOnly;
  }
  return isPackDiagramSource(getCourseDiagramSourcePath(diagramId));
}

function isPackDiagramSource(sourcePath: string | null): boolean {
  return sourcePath?.startsWith("pack:") ?? false;
}
