import { useCallback } from "react";
import { useCourseWorkbenchShell } from "./course-workbench-context";
import type { CourseWorkbenchEditorType } from "./course-workbench-focus.store";

/** Focus a workbench editor pane and sync the focus store (Content, Diagram, 3D Scene, …). */
export function useFocusCourseWorkbenchEditor() {
  const { focusWorkbenchPane } = useCourseWorkbenchShell();

  return useCallback(
    (editorType: CourseWorkbenchEditorType) => {
      focusWorkbenchPane(editorType);
    },
    [focusWorkbenchPane],
  );
}
