import assert from "node:assert/strict";
import { test } from "node:test";
import { pointerToDashboardGridCell } from "../../src/webview/sensor-studio/core/dashboard/dashboard-grid-resize";
import {
  dashboardSquareGridIntrinsicWidthPx,
  dashboardSquareGridTemplateColumns,
} from "../../src/webview/sensor-studio/core/dashboard/dashboard-square-grid";

test("dashboardSquareGridIntrinsicWidthPx uses fixed square tracks", () => {
  const metrics = { columns: 12, gapPx: 8, paddingPx: 16, rowHeightPx: 48 };
  assert.equal(dashboardSquareGridIntrinsicWidthPx(metrics), 16 * 2 + 12 * 48 + 11 * 8);
  assert.equal(
    dashboardSquareGridTemplateColumns(12, 48),
    "repeat(12, 48px)",
  );
});

test("pointerToDashboardGridCell uses square cell width not container stretch", () => {
  const metrics = { columns: 12, gapPx: 8, paddingPx: 16, rowHeightPx: 48 };
  const gridRect = {
    left: 100,
    top: 50,
    width: 2000,
    height: 400,
    right: 2100,
    bottom: 450,
    x: 100,
    y: 50,
    toJSON: () => ({}),
  } as DOMRect;
  const cell = pointerToDashboardGridCell({
    clientX: 100 + 16 + 48 / 2,
    clientY: 50 + 16 + 48 / 2,
    gridRect,
    metrics,
  });
  assert.equal(cell.column, 1);
  assert.equal(cell.row, 1);
});
