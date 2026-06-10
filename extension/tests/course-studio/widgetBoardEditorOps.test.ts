import assert from "node:assert/strict";
import test from "node:test";

import {
  createWidgetBoardEntry,
  createWidgetBoardEntryAtPlacement,
  findOpenWidgetBoardPlacement,
  findPlacementAtAnchor,
  removeWidgetBoardWidget,
} from "../../src/webview/course-studio/maintainer/widget-board/widgetBoardEditorOps";
import { createEvCompactWidgetBoardWidgets } from "../../src/webview/course-studio/schemas/widgetBoard.v1";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";

test("findOpenWidgetBoardPlacement avoids occupied inner cells", () => {
  const widgets = createEvCompactWidgetBoardWidgets();
  const placement = findOpenWidgetBoardPlacement(widgets, 6, { columnSpan: 2, rowSpan: 2 });
  const keys = new Set<string>();
  for (const widget of widgets) {
    for (
      let row = widget.placement.row;
      row < widget.placement.row + widget.placement.rowSpan;
      row += 1
    ) {
      for (
        let col = widget.placement.column;
        col < widget.placement.column + widget.placement.columnSpan;
        col += 1
      ) {
        keys.add(`${row}:${col}`);
      }
    }
  }
  for (let row = placement.row; row < placement.row + placement.rowSpan; row += 1) {
    for (let col = placement.column; col < placement.column + placement.columnSpan; col += 1) {
      assert.equal(keys.has(`${row}:${col}`), false);
    }
  }
});

test("createWidgetBoardEntry allocates unique metric-bar ids", () => {
  const widgets = createEvCompactWidgetBoardWidgets();
  const entry = createWidgetBoardEntry("metric-bar", widgets, 6);
  assert.equal(entry.kind, "metric-bar");
  assert.ok(!widgets.some((widget) => widget.id === entry.id));
});

test("findPlacementAtAnchor falls back to the next open footprint when anchor edge is tight", () => {
  const widgets = createEvCompactWidgetBoardWidgets();
  const placement = findPlacementAtAnchor(6, 4, "hero-radial-gauge", widgets, 6);
  assert.ok(placement.columnSpan === 3);
  assert.ok(placement.rowSpan === 3);
});

test("findPlacementAtAnchor aligns span to include anchor cell near the grid edge", () => {
  const widgets = createEvCompactWidgetBoardWidgets();
  const placement = findPlacementAtAnchor(6, 5, "metric-bar", widgets, 6);
  assert.equal(placement.column, 5);
  assert.equal(placement.row, 5);
  assert.equal(placement.columnSpan, 2);
  assert.equal(placement.rowSpan, 2);
});

test("createWidgetBoardEntryAtPlacement uses anchor when open", () => {
  const widgets = createEvCompactWidgetBoardWidgets();
  const placement = findPlacementAtAnchor(1, 5, "metric-bar", widgets, 6);
  const entry = createWidgetBoardEntryAtPlacement("metric-bar", placement, widgets);
  assert.equal(entry.placement.row, 5);
  assert.equal(entry.placement.column, 1);
});

test("removeWidgetBoardWidget keeps at least one widget", () => {
  const page = parsePageV1({
    version: 1,
    id: "wb",
    title: "WB",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [
      {
        id: "board-1",
        kind: "widget-board",
        placement: { column: 1, row: 1, columnSpan: 8, rowSpan: 5 },
        widgets: createEvCompactWidgetBoardWidgets(),
      },
    ],
  });
  const block = page.blocks[0];
  assert.equal(block?.kind, "widget-board");
  if (block?.kind !== "widget-board") {
    return;
  }
  assert.equal(removeWidgetBoardWidget(block, "power")?.widgets.length, 2);
  assert.equal(removeWidgetBoardWidget({ ...block, widgets: [block.widgets[0]!] }, "power"), null);
});
