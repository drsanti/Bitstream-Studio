import { create } from "zustand";

export const COURSE_WORKBENCH_EDITOR_TYPES = [
  "outline",
  "content",
  "inspector",
  "diagram",
  "markdown",
  "scene-3d",
] as const;

export type CourseWorkbenchEditorType = (typeof COURSE_WORKBENCH_EDITOR_TYPES)[number];

const COURSE_WORKBENCH_SIDE_PANEL_TYPES = new Set<CourseWorkbenchEditorType>([
  "outline",
  "inspector",
]);

export function isCourseWorkbenchSidePanelType(
  editorType: CourseWorkbenchEditorType | null | undefined,
): boolean {
  return editorType != null && COURSE_WORKBENCH_SIDE_PANEL_TYPES.has(editorType);
}

type CourseWorkbenchFocusState = {
  activeEditorType: CourseWorkbenchEditorType | null;
  /** Last focused editor pane (excluding the inspector side panel). */
  contextEditorType: CourseWorkbenchEditorType;
  setActiveEditorType: (editorType: CourseWorkbenchEditorType | null) => void;
};

export const useCourseWorkbenchFocusStore = create<CourseWorkbenchFocusState>((set, get) => ({
  activeEditorType: "content",
  contextEditorType: "content",
  setActiveEditorType: (editorType) => {
    set({
      activeEditorType: editorType,
      contextEditorType:
        editorType != null && !isCourseWorkbenchSidePanelType(editorType)
          ? editorType
          : get().contextEditorType,
    });
  },
}));
