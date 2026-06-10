import { useCallback } from "react";
import { createPageBlock } from "./blockFactory";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";
import { useCourseWorkbenchFocusStore } from "../workbench/course-workbench-focus.store";

export function useAddMarkdownBlock() {
  const page = useCoursePageEditorStore((s) => s.page);
  const addBlock = useCoursePageEditorStore((s) => s.addBlock);
  const setActiveEditorType = useCourseWorkbenchFocusStore((s) => s.setActiveEditorType);

  return useCallback(() => {
    if (page == null) {
      return;
    }
    const block = createPageBlock("markdown", page);
    addBlock(block);
    setActiveEditorType("markdown");
  }, [addBlock, page, setActiveEditorType]);
}

export function useOpenMarkdownBlockInEditor() {
  const selectBlock = useCoursePageEditorStore((s) => s.selectBlock);
  const setActiveEditorType = useCourseWorkbenchFocusStore((s) => s.setActiveEditorType);

  return useCallback(
    (blockId: string) => {
      selectBlock(blockId);
      setActiveEditorType("markdown");
    },
    [selectBlock, setActiveEditorType],
  );
}
