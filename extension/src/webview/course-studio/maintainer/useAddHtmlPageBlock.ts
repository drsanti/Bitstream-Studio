import { useCallback } from "react";
import { createPageBlock } from "./blockFactory";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";
import { useCourseWorkbenchFocusStore } from "../workbench/course-workbench-focus.store";

export function useAddHtmlPageBlock() {
  const page = useCoursePageEditorStore((s) => s.page);
  const addBlock = useCoursePageEditorStore((s) => s.addBlock);
  const setActiveEditorType = useCourseWorkbenchFocusStore((s) => s.setActiveEditorType);

  return useCallback(() => {
    if (page == null) {
      return;
    }
    const block = createPageBlock("html-page", page);
    addBlock(block);
    setActiveEditorType("html-page");
  }, [addBlock, page, setActiveEditorType]);
}

export function useOpenHtmlPageBlockInEditor() {
  const selectBlock = useCoursePageEditorStore((s) => s.selectBlock);
  const setActiveEditorType = useCourseWorkbenchFocusStore((s) => s.setActiveEditorType);

  return useCallback(
    (blockId: string) => {
      selectBlock(blockId);
      setActiveEditorType("html-page");
    },
    [selectBlock, setActiveEditorType],
  );
}
