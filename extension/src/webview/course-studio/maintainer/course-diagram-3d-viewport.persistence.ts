import {
  isDiagram3dTransformGizmoMode,
  type Diagram3dTransformGizmoMode,
} from "../runtime/diagram/diagram3dGizmoHelpers";
import type { StudioViewportProjectionMode } from "../../sensor-studio/core/viewport/studio-viewport-projection";
import type { Scene3dSelectionAppearancePrefs } from "../runtime/diagram/diagram3dSelectionAppearance";
import {
  DEFAULT_SCENE_3D_SELECTION_APPEARANCE,
  parseScene3dSelectionAppearancePrefs,
} from "../runtime/diagram/diagram3dSelectionAppearance";

const GIZMO_MODE_KEY = "ternion.course-studio.diagram3dViewport.gizmoMode.v1";
const GIZMO_SIZE_KEY = "ternion.course-studio.diagram3dViewport.gizmoSize.v1";
const PROJECTION_KEY = "ternion.course-studio.diagram3dViewport.projection.v1";
const SELECTION_APPEARANCE_KEY = "ternion.course-studio.scene3dViewport.selectionAppearance.v1";

export const COURSE_DIAGRAM_3D_GIZMO_SIZE_MIN = 0.6;
export const COURSE_DIAGRAM_3D_GIZMO_SIZE_MAX = 2.5;
export const COURSE_DIAGRAM_3D_GIZMO_SIZE_DEFAULT = 1.25;

export function readStoredCourseDiagram3dGizmoMode(): Diagram3dTransformGizmoMode {
  try {
    const raw = localStorage.getItem(GIZMO_MODE_KEY);
    if (isDiagram3dTransformGizmoMode(raw)) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return "translate";
}

export function writeStoredCourseDiagram3dGizmoMode(mode: Diagram3dTransformGizmoMode): void {
  try {
    localStorage.setItem(GIZMO_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function clampCourseDiagram3dGizmoSize(value: number): number {
  if (!Number.isFinite(value)) {
    return COURSE_DIAGRAM_3D_GIZMO_SIZE_DEFAULT;
  }
  return Math.min(
    COURSE_DIAGRAM_3D_GIZMO_SIZE_MAX,
    Math.max(COURSE_DIAGRAM_3D_GIZMO_SIZE_MIN, value),
  );
}

export function readStoredCourseDiagram3dGizmoSize(): number {
  try {
    const raw = localStorage.getItem(GIZMO_SIZE_KEY);
    if (raw != null) {
      const parsed = Number.parseFloat(raw);
      if (Number.isFinite(parsed)) {
        return clampCourseDiagram3dGizmoSize(parsed);
      }
    }
  } catch {
    /* ignore */
  }
  return COURSE_DIAGRAM_3D_GIZMO_SIZE_DEFAULT;
}

export function writeStoredCourseDiagram3dGizmoSize(size: number): void {
  try {
    localStorage.setItem(GIZMO_SIZE_KEY, String(clampCourseDiagram3dGizmoSize(size)));
  } catch {
    /* ignore */
  }
}

export function readStoredCourseDiagram3dProjection(): StudioViewportProjectionMode {
  try {
    const raw = localStorage.getItem(PROJECTION_KEY);
    if (raw === "orthographic" || raw === "perspective") {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return "perspective";
}

export function writeStoredCourseDiagram3dProjection(mode: StudioViewportProjectionMode): void {
  try {
    localStorage.setItem(PROJECTION_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function readStoredScene3dSelectionAppearance(): Scene3dSelectionAppearancePrefs {
  try {
    const raw = localStorage.getItem(SELECTION_APPEARANCE_KEY);
    if (raw != null) {
      return parseScene3dSelectionAppearancePrefs(JSON.parse(raw));
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_SCENE_3D_SELECTION_APPEARANCE };
}

export function writeStoredScene3dSelectionAppearance(
  prefs: Scene3dSelectionAppearancePrefs,
): void {
  try {
    localStorage.setItem(SELECTION_APPEARANCE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}
