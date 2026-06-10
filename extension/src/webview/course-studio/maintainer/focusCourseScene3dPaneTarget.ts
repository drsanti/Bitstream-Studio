import type { CourseWorkbenchEditorType } from "../workbench/course-workbench-focus.store";

import type { PageV1 } from "../schemas/page.v1";

import { ensureCourseSceneDraft } from "../content/sceneRegistry";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

export function focusCourseScene3dPaneTarget(
  blockId: string,
  actions: {
    selectBlock: (blockId: string) => void;
    focusWorkbenchEditor: (editorType: CourseWorkbenchEditorType) => void;
  },
  pageOverride?: PageV1 | null,
): boolean {
  const page = pageOverride ?? useCoursePageEditorStore.getState().page;
  if (page == null) {
    return false;
  }

  const block = page.blocks.find((entry) => entry.id === blockId);
  if (block == null || block.kind !== "scene-3d") {
    return false;
  }

  actions.selectBlock(blockId);
  ensureCourseSceneDraft(block.documentId);
  actions.focusWorkbenchEditor("scene-3d");
  return true;
}
