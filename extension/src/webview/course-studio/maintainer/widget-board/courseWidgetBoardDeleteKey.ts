import { shouldRouteDeleteToWidgetBoardWidget } from "../courseMaintainerDeleteContext";
import { useCoursePageEditorStore } from "../useCoursePageEditorStore";
import { removeWidgetBoardWidget } from "./widgetBoardEditorOps";
import { useCourseWidgetBoardEditorStore } from "./useCourseWidgetBoardEditorStore";

type DeleteKeyEvent = Pick<
  KeyboardEvent,
  "key" | "target" | "preventDefault" | "stopImmediatePropagation" | "stopPropagation"
>;

function shouldDeferWidgetBoardWidgetDeleteKey(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (el == null) {
    return false;
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
  if (el.closest("[data-course-block-content-fields]")) {
    const tag = el.tagName.toLowerCase();
    if (tag === "textarea" || tag === "input" || tag === "select") {
      return true;
    }
  }
  if (el.isContentEditable) {
    return true;
  }
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") {
    return true;
  }
  return false;
}

function stopDeleteKeyEvent(event: DeleteKeyEvent): void {
  event.preventDefault();
  if (typeof event.stopImmediatePropagation === "function") {
    event.stopImmediatePropagation();
  } else {
    event.stopPropagation();
  }
}

/** Returns true when the key was handled (widget removed or block delete was suppressed). */
export function tryDeleteSelectedWidgetBoardWidget(event: DeleteKeyEvent): boolean {
  if (event.key !== "Delete" && event.key !== "Backspace") {
    return false;
  }
  if (shouldDeferWidgetBoardWidgetDeleteKey(event.target)) {
    return false;
  }
  if (!shouldRouteDeleteToWidgetBoardWidget(event.target)) {
    return false;
  }

  const selectedWidgetId = useCourseWidgetBoardEditorStore.getState().selectedWidgetId;
  if (selectedWidgetId == null) {
    return false;
  }

  const { selectedBlockId, page, updateBlock } = useCoursePageEditorStore.getState();
  if (selectedBlockId == null || page == null) {
    return false;
  }

  const block = page.blocks.find(
    (entry) => entry.id === selectedBlockId && entry.kind === "widget-board",
  );
  if (block == null || block.kind !== "widget-board") {
    return false;
  }

  const next = removeWidgetBoardWidget(block, selectedWidgetId);
  stopDeleteKeyEvent(event);
  if (next == null) {
    return true;
  }

  updateBlock(block.id, { widgets: next.widgets });
  useCourseWidgetBoardEditorStore.getState().selectWidget(null);
  return true;
}
