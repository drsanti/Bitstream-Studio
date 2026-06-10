import { useEffect } from "react";
import { useCourseWorkbenchFocusStore } from "../workbench/course-workbench-focus.store";
import { useCourseDiagramEditorStore } from "./useCourseDiagramEditorStore";
import { tryDeleteSelectedCoursePageBlock } from "./coursePageBlockDeleteKey";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

function shouldDeferMaintainerShortcutToNativeTextControl(
  target: EventTarget | null,
  preferDiagramUndo: boolean,
): boolean {
  const el = target as HTMLElement | null;
  if (el == null) {
    return false;
  }
  if (el.closest("[data-course-diagram-json-input]")) {
    return true;
  }
  if (preferDiagramUndo) {
    return false;
  }
  if (el.closest("[data-course-page-text-input]")) {
    return true;
  }
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") {
    return true;
  }
  return el.isContentEditable;
}

/** Maintainer-wide Ctrl+Z / Cmd+Z — page grid edits + diagram editor (when Diagram tab). */
export function useCourseMaintainerKeyboardShortcuts(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const contextEditorType = useCourseWorkbenchFocusStore.getState().contextEditorType;
      const pageState = useCoursePageEditorStore.getState();
      const selectedBlock =
        pageState.page?.blocks.find((block) => block.id === pageState.selectedBlockId) ?? null;
      const diagramId =
        selectedBlock?.kind === "diagram-2d" ? selectedBlock.diagramId : null;
      const preferDiagramUndo = contextEditorType === "diagram" && diagramId != null;

      if (tryDeleteSelectedCoursePageBlock(event, contextEditorType)) {
        return;
      }

      if (shouldDeferMaintainerShortcutToNativeTextControl(event.target, preferDiagramUndo)) {
        return;
      }

      const mod = event.ctrlKey || event.metaKey;
      if (!mod || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();
      const isRedoChord =
        (event.shiftKey && key === "z") || (!event.shiftKey && key === "y");
      const isUndoChord = !event.shiftKey && key === "z";

      if (!isUndoChord && !isRedoChord) {
        return;
      }

      const diagramState = useCourseDiagramEditorStore.getState();
      const diagramStacks = diagramId != null ? diagramState.historyStacks[diagramId] : null;
      const diagramCanUndo = (diagramStacks?.undo.length ?? 0) > 0;
      const diagramCanRedo = (diagramStacks?.redo.length ?? 0) > 0;
      const pageCanUndo = pageState.historyStacks.undo.length > 0;
      const pageCanRedo = pageState.historyStacks.redo.length > 0;

      if (isUndoChord) {
        if (preferDiagramUndo && diagramCanUndo && diagramId != null) {
          event.preventDefault();
          event.stopImmediatePropagation();
          diagramState.undoDiagram(diagramId);
          return;
        }
        if (pageCanUndo) {
          event.preventDefault();
          event.stopImmediatePropagation();
          pageState.undoPage();
        }
        return;
      }

      if (preferDiagramUndo && diagramCanRedo && diagramId != null) {
        event.preventDefault();
        event.stopImmediatePropagation();
        diagramState.redoDiagram(diagramId);
        return;
      }
      if (pageCanRedo) {
        event.preventDefault();
        event.stopImmediatePropagation();
        pageState.redoPage();
      }
    };

    document.addEventListener("keydown", onKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [enabled]);
}
