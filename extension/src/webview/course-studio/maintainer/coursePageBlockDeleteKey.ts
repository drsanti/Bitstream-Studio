import type { CourseWorkbenchEditorType } from "../workbench/course-workbench-focus.store";
import { shouldRouteDeleteToPageBlock } from "./courseMaintainerDeleteContext";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

export function shouldDeferCoursePageBlockDeleteKey(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (el == null) {
    return false;
  }
  if (el.closest("[data-course-block-id]")) {
    return false;
  }
  if (el.closest(".course-block-placement-strip")) {
    const tag = el.tagName.toLowerCase();
    if (tag === "input" || tag === "select") {
      return true;
    }
  }
  if (el.closest("[data-course-diagram-json-input]")) {
    return true;
  }
  if (el.closest(".course-md-editor-shell")) {
    const tag = el.tagName.toLowerCase();
    if (tag === "textarea" || tag === "input" || tag === "select" || el.isContentEditable) {
      return true;
    }
  }
  if (el.closest(".course-workbench-scene-pane")) {
    return true;
  }
  if (el.closest(".course-workbench-widget-board-pane")) {
    return true;
  }
  if (el.closest("[data-course-block-content-fields]")) {
    const tag = el.tagName.toLowerCase();
    if (tag === "textarea" || tag === "input" || tag === "select") {
      return true;
    }
  }
  if (el.isContentEditable) {
    return true;
  }
  return false;
}

type DeleteKeyEvent = Pick<
  KeyboardEvent,
  "key" | "target" | "preventDefault" | "stopImmediatePropagation" | "stopPropagation"
>;

/** Returns true when the selected page block was removed. */
export function tryDeleteSelectedCoursePageBlock(
  event: DeleteKeyEvent,
  contextEditorType: CourseWorkbenchEditorType,
): boolean {
  if (event.key !== "Delete") {
    return false;
  }
  if (contextEditorType === "diagram" || contextEditorType === "scene-3d") {
    return false;
  }
  if (shouldDeferCoursePageBlockDeleteKey(event.target)) {
    return false;
  }
  if (!shouldRouteDeleteToPageBlock(event.target)) {
    return false;
  }

  const { selectedBlockId, page, removeBlock } = useCoursePageEditorStore.getState();
  if (selectedBlockId == null || page == null) {
    return false;
  }
  if (!page.blocks.some((block) => block.id === selectedBlockId)) {
    return false;
  }

  event.preventDefault();
  if (typeof event.stopImmediatePropagation === "function") {
    event.stopImmediatePropagation();
  } else {
    event.stopPropagation();
  }
  removeBlock(selectedBlockId);
  return true;
}
