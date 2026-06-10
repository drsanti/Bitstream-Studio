import { useCallback } from "react";
import { createPageBlock } from "../blockFactory";
import { useCoursePageEditorStore } from "../useCoursePageEditorStore";
import { useCourseWorkbenchFocusStore } from "../../workbench/course-workbench-focus.store";
import { useCourseWidgetBoardEditorStore } from "./useCourseWidgetBoardEditorStore";

export function useAddWidgetBoardBlock() {
  const page = useCoursePageEditorStore((s) => s.page);
  const addBlock = useCoursePageEditorStore((s) => s.addBlock);
  const selectBlock = useCoursePageEditorStore((s) => s.selectBlock);
  const setActiveEditorType = useCourseWorkbenchFocusStore((s) => s.setActiveEditorType);
  const clearWidgetSelection = useCourseWidgetBoardEditorStore((s) => s.clearWidgetSelection);

  return useCallback(() => {
    if (page == null) {
      return;
    }
    const block = createPageBlock("widget-board", page);
    addBlock(block);
    selectBlock(block.id);
    clearWidgetSelection();
    setActiveEditorType("widget-board");
  }, [addBlock, clearWidgetSelection, page, selectBlock, setActiveEditorType]);
}

export function useOpenWidgetBoardBlockInEditor() {
  const selectBlock = useCoursePageEditorStore((s) => s.selectBlock);
  const setActiveEditorType = useCourseWorkbenchFocusStore((s) => s.setActiveEditorType);
  const clearWidgetSelection = useCourseWidgetBoardEditorStore((s) => s.clearWidgetSelection);

  return useCallback(
    (blockId: string) => {
      selectBlock(blockId);
      clearWidgetSelection();
      setActiveEditorType("widget-board");
    },
    [clearWidgetSelection, selectBlock, setActiveEditorType],
  );
}
