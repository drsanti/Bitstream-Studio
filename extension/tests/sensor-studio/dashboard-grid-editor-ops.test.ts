import assert from "node:assert/strict";
import { test } from "node:test";
import {
  findDashboardPlacementAtAnchor,
  findOpenDashboardPlacement,
} from "../../src/webview/sensor-studio/core/dashboard/dashboard-grid-editor-ops";
import type { DashboardPlacementV1 } from "../../src/webview/sensor-studio/core/dashboard/dashboard-placement";

test("findOpenDashboardPlacement skips occupied cells", () => {
  const occupied: DashboardPlacementV1[] = [
    { column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
  ];
  const next = findOpenDashboardPlacement(occupied, 12, { columnSpan: 2, rowSpan: 1 });
  assert.deepEqual(next, { column: 3, row: 1, columnSpan: 2, rowSpan: 1 });
});

test("findDashboardPlacementAtAnchor prefers origin covering clicked cell", () => {
  const occupied: DashboardPlacementV1[] = [
    { column: 1, row: 1, columnSpan: 4, rowSpan: 1 },
  ];
  const placement = findDashboardPlacementAtAnchor(5, 1, "dashboard-button", occupied, 12);
  assert.equal(placement.column, 5);
  assert.equal(placement.row, 1);
  assert.equal(placement.columnSpan, 2);
});

test("findDashboardPlacementAtAnchor falls back when anchor is blocked", () => {
  const occupied: DashboardPlacementV1[] = [
    { column: 1, row: 1, columnSpan: 12, rowSpan: 1 },
  ];
  const placement = findDashboardPlacementAtAnchor(6, 1, "dashboard-led", occupied, 12);
  assert.ok(placement.row > 1);
});
