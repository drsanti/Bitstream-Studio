import assert from "node:assert/strict";
import { test } from "node:test";
import { tryDeleteSelectedWidgetBoardWidget } from "../../src/webview/course-studio/maintainer/widget-board/courseWidgetBoardDeleteKey";
import { useCourseWorkbenchFocusStore } from "../../src/webview/course-studio/workbench/course-workbench-focus.store";
import { useCourseWidgetBoardEditorStore } from "../../src/webview/course-studio/maintainer/widget-board/useCourseWidgetBoardEditorStore";
import { useCoursePageEditorStore } from "../../src/webview/course-studio/maintainer/useCoursePageEditorStore";
import { createEvCompactWidgetBoardWidgets } from "../../src/webview/course-studio/schemas/widgetBoard.v1";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";

function mockElement(options: {
  ancestors?: Record<string, boolean>;
}): EventTarget {
  const ancestors = options.ancestors ?? {};
  return {
    tagName: "DIV",
    isContentEditable: false,
    closest(selector: string) {
      return ancestors[selector] ? { tagName: "DIV" } : null;
    },
  } as unknown as EventTarget;
}

function mockDeleteEvent(
  target: EventTarget | null,
  key: "Delete" | "Backspace" = "Delete",
): KeyboardEvent {
  let prevented = false;
  return {
    key,
    target,
    preventDefault: () => {
      prevented = true;
    },
    stopImmediatePropagation: () => {},
    stopPropagation: () => {},
    get defaultPrevented() {
      return prevented;
    },
  } as KeyboardEvent;
}

function pageWithWidgetBoard() {
  return parsePageV1({
    version: 1,
    id: "widget-demo",
    title: "Widget demo",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [
      {
        id: "widget-board-1",
        kind: "widget-board",
        placement: { column: 1, row: 1, columnSpan: 8, rowSpan: 5 },
        grid: { columns: 6, rowHeightPx: 40, gapPx: 8, paddingPx: 16 },
        widgets: createEvCompactWidgetBoardWidgets(),
      },
    ],
  });
}

test("Delete removes selected inner widget in widget-board editor context", () => {
  const page = pageWithWidgetBoard();
  const block = page.blocks[0];
  assert.equal(block?.kind, "widget-board");
  if (block?.kind !== "widget-board") {
    return;
  }

  useCoursePageEditorStore.getState().initPage(page, "test.page.json");
  useCoursePageEditorStore.getState().selectBlock("widget-board-1");
  useCourseWidgetBoardEditorStore.getState().selectWidget("power");
  useCourseWorkbenchFocusStore.getState().setActiveEditorType("widget-board");

  const target = mockElement({ ancestors: { "[data-course-widget-editor-id]": true } });
  const event = mockDeleteEvent(target);
  const handled = tryDeleteSelectedWidgetBoardWidget(event);

  assert.equal(handled, true);
  assert.equal(event.defaultPrevented, true);
  const nextBlock = useCoursePageEditorStore.getState().page?.blocks[0];
  assert.equal(nextBlock?.kind, "widget-board");
  if (nextBlock?.kind === "widget-board") {
    assert.equal(nextBlock.widgets.length, 2);
    assert.equal(nextBlock.widgets.some((widget) => widget.id === "power"), false);
  }
  assert.equal(useCourseWidgetBoardEditorStore.getState().selectedWidgetId, null);
});

test("Delete is ignored for widget-board editor when no inner widget is selected", () => {
  const page = pageWithWidgetBoard();
  useCoursePageEditorStore.getState().initPage(page, "test.page.json");
  useCoursePageEditorStore.getState().selectBlock("widget-board-1");
  useCourseWidgetBoardEditorStore.getState().clearWidgetSelection();

  const target = mockElement({ ancestors: { ".course-workbench-widget-board-pane": true } });
  const event = mockDeleteEvent(target);
  useCourseWorkbenchFocusStore.getState().setActiveEditorType("widget-board");

  const handled = tryDeleteSelectedWidgetBoardWidget(event);

  assert.equal(handled, false);
  assert.equal(useCoursePageEditorStore.getState().page?.blocks.length, 1);
});
