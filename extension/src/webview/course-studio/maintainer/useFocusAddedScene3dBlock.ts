import { useCallback } from "react";

import { focusCourseScene3dPaneTarget } from "./focusCourseScene3dPaneTarget";
import { suppressCoursePageGridDeselect } from "./coursePageEditorDeselectGuard";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";
import type { CourseWorkbenchEditorType } from "../workbench/course-workbench-focus.store";
import { useFocusCourseWorkbenchEditor } from "../workbench/useFocusCourseWorkbenchEditor";

function scheduleFocusAddedScene3dBlock(
  blockId: string,
  actions: {
    selectBlock: (blockId: string) => void;
    focusWorkbenchEditor: (editorType: CourseWorkbenchEditorType) => void;
  },
): void {
  suppressCoursePageGridDeselect();
  focusCourseScene3dPaneTarget(blockId, actions);

  queueMicrotask(() => {
    requestAnimationFrame(() => {
      focusCourseScene3dPaneTarget(blockId, actions);
    });
  });
}

/** Select a new scene-3d block and focus the 3D Scene Editor workbench pane. */
export function useFocusAddedScene3dBlock() {
  const selectBlock = useCoursePageEditorStore((s) => s.selectBlock);
  const focusWorkbenchEditor = useFocusCourseWorkbenchEditor();

  return useCallback(
    (blockId: string) => {
      scheduleFocusAddedScene3dBlock(blockId, {
        selectBlock,
        focusWorkbenchEditor,
      });
    },
    [focusWorkbenchEditor, selectBlock],
  );
}
