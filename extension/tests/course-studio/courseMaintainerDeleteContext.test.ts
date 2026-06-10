import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resolveCourseMaintainerDeleteScope,
  resolveCourseMaintainerPaneFromTarget,
  shouldRouteDeleteToPageBlock,
  shouldRouteDeleteToWidgetBoardWidget,
} from "../../src/webview/course-studio/maintainer/courseMaintainerDeleteContext";
import { useCourseWidgetBoardEditorStore } from "../../src/webview/course-studio/maintainer/widget-board/useCourseWidgetBoardEditorStore";
import { useCoursePageEditorStore } from "../../src/webview/course-studio/maintainer/useCoursePageEditorStore";
import { useCourseWorkbenchFocusStore } from "../../src/webview/course-studio/workbench/course-workbench-focus.store";
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

test("resolveCourseMaintainerPaneFromTarget maps widget editor cells to widget-board", () => {
  const target = mockElement({ ancestors: { "[data-course-widget-editor-id]": true } });
  assert.equal(resolveCourseMaintainerPaneFromTarget(target), "widget-board");
});

test("resolveCourseMaintainerDeleteScope routes widget delete inside widget editor", () => {
  const page = pageWithWidgetBoard();
  useCoursePageEditorStore.getState().initPage(page, "test.page.json");
  useCoursePageEditorStore.getState().selectBlock("widget-board-1");
  useCourseWidgetBoardEditorStore.getState().selectWidget("power");
  useCourseWorkbenchFocusStore.getState().setActiveEditorType("widget-board");

  const target = mockElement({ ancestors: { ".course-workbench-widget-board-pane": true } });
  assert.equal(resolveCourseMaintainerDeleteScope(target), "widget-board-widget");
  assert.equal(shouldRouteDeleteToWidgetBoardWidget(target), true);
  assert.equal(shouldRouteDeleteToPageBlock(target), false);
});

test("resolveCourseMaintainerDeleteScope routes page block delete in content composer", () => {
  const page = pageWithWidgetBoard();
  useCoursePageEditorStore.getState().initPage(page, "test.page.json");
  useCoursePageEditorStore.getState().selectBlock("widget-board-1");
  useCourseWidgetBoardEditorStore.getState().clearWidgetSelection();
  useCourseWorkbenchFocusStore.getState().setActiveEditorType("content");

  const target = mockElement({ ancestors: { ".course-workbench-content-pane": true } });
  assert.equal(resolveCourseMaintainerDeleteScope(target), "page-block");
  assert.equal(shouldRouteDeleteToPageBlock(target), true);
  assert.equal(shouldRouteDeleteToWidgetBoardWidget(target), false);
});

test("resolveCourseMaintainerDeleteScope ignores page block delete in diagram editor", () => {
  useCourseWorkbenchFocusStore.getState().setActiveEditorType("diagram");
  const target = mockElement({ ancestors: { ".course-workbench-diagram-pane": true } });
  assert.equal(resolveCourseMaintainerDeleteScope(target), null);
  assert.equal(shouldRouteDeleteToPageBlock(target), false);
});
