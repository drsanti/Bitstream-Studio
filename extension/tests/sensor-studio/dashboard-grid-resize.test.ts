import assert from "node:assert/strict";
import { test } from "node:test";
import {
  computeDashboardPlacementFromResize,
  computeDashboardSpanFromCorner,
  pointerToDashboardGridCell,
} from "../../src/webview/sensor-studio/core/dashboard/dashboard-grid-resize";
import { clampDashboardGridOrigin } from "../../src/webview/sensor-studio/core/dashboard/dashboard-grid-drag-move";
import { dashboardOccupiedCellKeySet } from "../../src/webview/sensor-studio/core/dashboard/dashboard-placement";

test("pointerToDashboardGridCell maps coordinates into 1-based cells", () => {
  const cell = pointerToDashboardGridCell({
    clientX: 120,
    clientY: 80,
    gridRect: { left: 0, top: 0, width: 400, height: 300 } as DOMRect,
    metrics: { columns: 12, gapPx: 8, paddingPx: 16, rowHeightPx: 48 },
  });
  assert.ok(cell.column >= 1);
  assert.ok(cell.row >= 1);
});

test("clampDashboardGridOrigin keeps wide widgets inside the grid", () => {
  const origin = clampDashboardGridOrigin({
    column: 11,
    row: 2,
    columnSpan: 4,
    columns: 12,
  });
  assert.equal(origin.column, 9);
  assert.equal(origin.row, 2);
});

test("dashboardOccupiedCellKeySet merges placement footprints", () => {
  const keys = dashboardOccupiedCellKeySet([
    { column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
    { column: 4, row: 2, columnSpan: 1, rowSpan: 2 },
  ]);
  assert.deepEqual([...keys].sort(), ["1:1", "1:2", "2:4", "3:4"]);
});

test("computeDashboardSpanFromCorner clamps column span to grid width", () => {
  const span = computeDashboardSpanFromCorner({
    origin: { column: 10, row: 2 },
    targetColumn: 12,
    targetRow: 4,
    columns: 12,
  });
  assert.equal(span.columnSpan, 3);
  assert.equal(span.rowSpan, 3);
});

test("computeDashboardPlacementFromResize grows from south-east corner", () => {
  const placement = computeDashboardPlacementFromResize({
    base: { column: 2, row: 3, columnSpan: 2, rowSpan: 1 },
    handle: "se",
    targetColumn: 5,
    targetRow: 5,
    columns: 12,
  });
  assert.deepEqual(placement, {
    column: 2,
    row: 3,
    columnSpan: 4,
    rowSpan: 3,
  });
});

test("computeDashboardPlacementFromResize shrinks from north-west corner", () => {
  const placement = computeDashboardPlacementFromResize({
    base: { column: 2, row: 2, columnSpan: 4, rowSpan: 3 },
    handle: "nw",
    targetColumn: 3,
    targetRow: 3,
    columns: 12,
  });
  assert.deepEqual(placement, {
    column: 3,
    row: 3,
    columnSpan: 3,
    rowSpan: 2,
  });
});

test("computeDashboardPlacementFromResize adjusts west edge only", () => {
  const placement = computeDashboardPlacementFromResize({
    base: { column: 2, row: 4, columnSpan: 3, rowSpan: 2 },
    handle: "w",
    targetColumn: 4,
    targetRow: 4,
    columns: 12,
  });
  assert.deepEqual(placement, {
    column: 4,
    row: 4,
    columnSpan: 1,
    rowSpan: 2,
  });
});

test("computeDashboardPlacementFromResize adjusts north edge only", () => {
  const placement = computeDashboardPlacementFromResize({
    base: { column: 5, row: 2, columnSpan: 2, rowSpan: 4 },
    handle: "n",
    targetColumn: 5,
    targetRow: 4,
    columns: 12,
  });
  assert.deepEqual(placement, {
    column: 5,
    row: 4,
    columnSpan: 2,
    rowSpan: 2,
  });
});
