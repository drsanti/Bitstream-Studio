import { useCourseDiagramEditorStore } from "../maintainer/useCourseDiagramEditorStore";
import { parseDiagramV1, type DiagramV1 } from "../schemas/diagram.v1";
import pilotMemsDiagramJson from "./pilot-bmi-accel-mems.diagram.v1.json";

export const PILOT_MEMS_DIAGRAM_SOURCE_PATH =
  "src/webview/course-studio/content/pilot-bmi-accel-mems.diagram.v1.json";

const BUNDLED_DIAGRAMS: Record<string, DiagramV1> = {
  "pilot-bmi-accel-mems": parseDiagramV1(pilotMemsDiagramJson),
};

const DIAGRAM_SOURCE_PATHS: Record<string, string> = {
  "pilot-bmi-accel-mems": PILOT_MEMS_DIAGRAM_SOURCE_PATH,
};

export function loadCourseDiagram(diagramId: string): DiagramV1 | null {
  const draft = useCourseDiagramEditorStore.getState().drafts[diagramId];
  if (draft != null) {
    return draft;
  }
  return BUNDLED_DIAGRAMS[diagramId] ?? null;
}

export function getCourseDiagramSourcePath(diagramId: string): string | null {
  return DIAGRAM_SOURCE_PATHS[diagramId] ?? null;
}

export const COURSE_DIAGRAM_IDS = Object.keys(BUNDLED_DIAGRAMS);

/** All diagram ids with an in-memory draft (bundled + session-created). */
export function useCourseDiagramIds(): string[] {
  return useCourseDiagramEditorStore((s) => Object.keys(s.drafts).sort());
}

/** Register a dev- or session-created diagram (not shipped in the VSIX bundle). */
export function registerCourseDiagram(diagram: DiagramV1, sourcePath: string): void {
  useCourseDiagramEditorStore.getState().initDiagram(diagram, sourcePath);
}

export function initBundledCourseDiagrams(): void {
  const { initDiagram } = useCourseDiagramEditorStore.getState();
  for (const id of COURSE_DIAGRAM_IDS) {
    const diagram = BUNDLED_DIAGRAMS[id];
    const sourcePath = DIAGRAM_SOURCE_PATHS[id];
    if (diagram != null && sourcePath != null) {
      initDiagram(diagram, sourcePath);
    }
  }
}

/** React hook — prefers maintainer draft over bundled JSON. */
export function useCourseDiagram(diagramId: string): DiagramV1 | null {
  const draft = useCourseDiagramEditorStore((s) => s.drafts[diagramId]);
  if (draft != null) {
    return draft;
  }
  return BUNDLED_DIAGRAMS[diagramId] ?? null;
}
