import { loadPersistedLayout } from "../../ui/workbench/layoutPersistence";
import type { LayoutNode } from "../../ui/workbench/types";
import {
  DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT,
  LEGACY_COURSE_AUTHOR_WORKBENCH_LAYOUT,
  V2_COURSE_AUTHOR_WORKBENCH_LAYOUT,
  V3_COURSE_AUTHOR_WORKBENCH_LAYOUT,
} from "./default-course-workbench-layout";

export const COURSE_WORKBENCH_LAYOUT_REVISION = 6 as const;
const REVISION_STORAGE_KEY = "course-studio:workbench-layout-revision.v1";

function layoutShapeFingerprint(layout: LayoutNode): string {
  const parts: string[] = [];
  const walk = (node: LayoutNode): void => {
    if (node.type === "editor") {
      parts.push(`e:${node.editorType}`);
      return;
    }
    if (node.type === "tabs") {
      parts.push(`t:${node.panes.map((pane) => pane.editorType).join(",")}`);
      return;
    }
    parts.push(`s:${node.direction}:${node.id ?? ""}`);
    walk(node.first);
    walk(node.second);
  };
  walk(layout);
  return parts.join("|");
}

const LEGACY_AUTHOR_FINGERPRINT = layoutShapeFingerprint(LEGACY_COURSE_AUTHOR_WORKBENCH_LAYOUT);
const V2_AUTHOR_FINGERPRINT = layoutShapeFingerprint(V2_COURSE_AUTHOR_WORKBENCH_LAYOUT);
const V3_AUTHOR_FINGERPRINT = layoutShapeFingerprint(V3_COURSE_AUTHOR_WORKBENCH_LAYOUT);

/** True when persisted layout matches the pre-v2 default tiling. */
export function isLegacyCourseAuthorWorkbenchLayout(layout: LayoutNode): boolean {
  return layoutShapeFingerprint(layout) === LEGACY_AUTHOR_FINGERPRINT;
}

/** True when persisted layout matches the v2 default (single inspector column). */
export function isV2CourseAuthorWorkbenchLayout(layout: LayoutNode): boolean {
  return layoutShapeFingerprint(layout) === V2_AUTHOR_FINGERPRINT;
}

/** True when persisted layout matches the v3 default (dual inspector column). */
export function isV3CourseAuthorWorkbenchLayout(layout: LayoutNode): boolean {
  return layoutShapeFingerprint(layout) === V3_AUTHOR_FINGERPRINT;
}

export function layoutContainsEditorType(layout: LayoutNode, editorType: string): boolean {
  if (layout.type === "editor") {
    return layout.editorType === editorType;
  }
  if (layout.type === "tabs") {
    return layout.panes.some((pane) => pane.editorType === editorType);
  }
  return (
    layoutContainsEditorType(layout.first, editorType) ||
    layoutContainsEditorType(layout.second, editorType)
  );
}

export function migrateCourseWorkbenchEditorType(editorType: string): string {
  if (editorType === "block-inspector") {
    return "inspector";
  }
  return editorType;
}

export function readCourseWorkbenchLayoutRevision(): number {
  if (typeof localStorage === "undefined") {
    return 0;
  }
  try {
    const raw = localStorage.getItem(REVISION_STORAGE_KEY);
    if (raw == null || raw.length === 0) {
      return 0;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export function writeCourseWorkbenchLayoutRevision(revision: number): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(REVISION_STORAGE_KEY, String(revision));
  } catch {
    /* ignore */
  }
}

/** Used by tests to simulate a stored session layout. */
export function readPersistedCourseWorkbenchLayout(): LayoutNode | null {
  return loadPersistedLayout("course-studio");
}

/** Used by tests to compare layout shapes. */
export function workbenchLayoutFingerprint(layout: LayoutNode): string {
  return layoutShapeFingerprint(layout);
}

export function defaultCourseAuthorWorkbenchLayoutFingerprint(): string {
  return layoutShapeFingerprint(DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT);
}

export function shouldResetCourseWorkbenchLayoutToDefault(layout: LayoutNode): boolean {
  return (
    isLegacyCourseAuthorWorkbenchLayout(layout) ||
    isV2CourseAuthorWorkbenchLayout(layout) ||
    isV3CourseAuthorWorkbenchLayout(layout) ||
    layoutContainsEditorType(layout, "block-inspector") ||
    !layoutContainsEditorType(layout, "outline") ||
    !layoutContainsEditorType(layout, "html-page")
  );
}
