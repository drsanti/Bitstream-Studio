import { useEffect, type RefObject } from "react";
import type { StandaloneWorkbenchHandle } from "../../ui/workbench";
import { resolveCourseWorkbenchEditorTypeForBlock } from "../maintainer/coursePageEditorFocus";
import { useCourseStudioMaintainerModeEnabled } from "../maintainer/courseStudioMaintainerMode";
import { useCoursePageEditorStore } from "../maintainer/useCoursePageEditorStore";
import { useCourseWorkbenchFocusStore } from "./course-workbench-focus.store";

export function useCourseWorkbenchAutoFocus(
  workbenchRef: RefObject<StandaloneWorkbenchHandle | null>,
) {
  const maintainer = useCourseStudioMaintainerModeEnabled();
  const selectedBlockId = useCoursePageEditorStore((s) => s.selectedBlockId);
  const page = useCoursePageEditorStore((s) => s.page);
  const setActiveEditorType = useCourseWorkbenchFocusStore((s) => s.setActiveEditorType);

  useEffect(() => {
    if (!maintainer || page == null) {
      return;
    }
    if (selectedBlockId == null) {
      const contextEditorType = useCourseWorkbenchFocusStore.getState().contextEditorType;
      if (
        contextEditorType === "scene-3d" ||
        contextEditorType === "diagram" ||
        contextEditorType === "markdown"
      ) {
        workbenchRef.current?.focusPane(contextEditorType);
        setActiveEditorType(contextEditorType);
        return;
      }
      workbenchRef.current?.focusPane("content");
      setActiveEditorType("content");
      return;
    }
    const block = page.blocks.find((entry) => entry.id === selectedBlockId);
    if (block == null) {
      workbenchRef.current?.focusPane("content");
      setActiveEditorType("content");
      return;
    }
    const editorType = resolveCourseWorkbenchEditorTypeForBlock(block);
    if (editorType != null) {
      workbenchRef.current?.focusPane(editorType);
      setActiveEditorType(editorType);
      return;
    }
    workbenchRef.current?.focusPane("inspector");
    setActiveEditorType("inspector");
  }, [maintainer, page, selectedBlockId, setActiveEditorType, workbenchRef]);
}
