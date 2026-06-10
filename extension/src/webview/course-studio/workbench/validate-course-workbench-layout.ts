import type { LayoutNode } from "../../ui/workbench/types";
import { createWorkbenchLayoutValidator } from "../../ui/workbench/create-workbench-layout-validator";
import { COURSE_WORKBENCH_EDITOR_TYPES } from "./course-workbench-focus.store";
import {
  COURSE_WORKBENCH_LAYOUT_REVISION,
  migrateCourseWorkbenchEditorType,
  readCourseWorkbenchLayoutRevision,
  shouldResetCourseWorkbenchLayoutToDefault,
  writeCourseWorkbenchLayoutRevision,
} from "./course-workbench-layout-migration";
import {
  COURSE_VIEW_WORKBENCH_LAYOUT,
  DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT,
} from "./default-course-workbench-layout";

function isLayoutNodeShape(value: unknown): value is LayoutNode {
  if (!value || typeof value !== "object") {
    return false;
  }
  const node = value as LayoutNode;
  if (node.type === "editor") {
    return typeof node.id === "string" && typeof node.editorType === "string";
  }
  if (node.type === "tabs") {
    return (
      typeof node.id === "string" &&
      Array.isArray(node.panes) &&
      node.panes.length > 0 &&
      typeof node.activeIndex === "number"
    );
  }
  if (node.type === "split") {
    return (
      typeof node.id === "string" &&
      (node.direction === "horizontal" || node.direction === "vertical") &&
      typeof node.ratio === "number" &&
      node.first != null &&
      node.second != null
    );
  }
  return false;
}

function remapLegacyEditorTypesInTree(node: LayoutNode): LayoutNode {
  if (node.type === "editor") {
    return { ...node, editorType: migrateCourseWorkbenchEditorType(node.editorType) };
  }
  if (node.type === "tabs") {
    return {
      ...node,
      panes: node.panes.map(
        (pane) => remapLegacyEditorTypesInTree(pane) as Extract<LayoutNode, { type: "editor" }>,
      ),
    };
  }
  return {
    ...node,
    first: remapLegacyEditorTypesInTree(node.first),
    second: remapLegacyEditorTypesInTree(node.second),
  };
}

const baseValidateCourseWorkbenchLayout = createWorkbenchLayoutValidator(
  DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT,
  COURSE_WORKBENCH_EDITOR_TYPES,
  "content",
);

export function validateCourseWorkbenchLayout(raw: unknown): LayoutNode {
  if (typeof localStorage !== "undefined") {
    const storedRevision = readCourseWorkbenchLayoutRevision();
    if (
      storedRevision < COURSE_WORKBENCH_LAYOUT_REVISION &&
      isLayoutNodeShape(raw) &&
      shouldResetCourseWorkbenchLayoutToDefault(raw)
    ) {
      writeCourseWorkbenchLayoutRevision(COURSE_WORKBENCH_LAYOUT_REVISION);
      return structuredClone(DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT);
    }
  }

  const preprocessed = isLayoutNodeShape(raw) ? remapLegacyEditorTypesInTree(raw) : raw;

  if (typeof localStorage === "undefined") {
    return baseValidateCourseWorkbenchLayout(preprocessed);
  }

  const storedRevision = readCourseWorkbenchLayoutRevision();
  if (storedRevision >= COURSE_WORKBENCH_LAYOUT_REVISION) {
    return baseValidateCourseWorkbenchLayout(preprocessed);
  }

  writeCourseWorkbenchLayoutRevision(COURSE_WORKBENCH_LAYOUT_REVISION);
  return baseValidateCourseWorkbenchLayout(preprocessed);
}

export type { CourseWorkbenchEditorType } from "./course-workbench-focus.store";

export function courseWorkbenchLayoutForMaintainerMode(maintainerEnabled: boolean): LayoutNode {
  return maintainerEnabled
    ? structuredClone(DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT)
    : structuredClone(COURSE_VIEW_WORKBENCH_LAYOUT);
}
