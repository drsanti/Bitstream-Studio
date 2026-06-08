import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDashboardStackPlacements } from "../../src/webview/sensor-studio/core/dashboard/dashboard-layout-arrange";
import type { DashboardSnapshotItemV1 } from "../../src/webview/sensor-studio/core/dashboard/dashboard-snapshot";

test("buildDashboardStackPlacements stacks widgets in column 1", () => {
  const items: DashboardSnapshotItemV1[] = [
    {
      kind: "widget",
      widget: {
        widgetKind: "button",
        sourceNodeId: "btn-1",
        catalogNodeId: "dashboard-button",
        label: "Go",
        placement: { column: 5, row: 3, columnSpan: 2, rowSpan: 1 },
        flexPlacement: { order: 0, grow: 0, shrink: 0, basis: "auto" },
        style: {},
        liveValue: null,
        enabled: true,
      },
    },
    {
      kind: "widget",
      widget: {
        widgetKind: "slider",
        sourceNodeId: "slider-1",
        catalogNodeId: "dashboard-slider",
        label: "Level",
        placement: { column: 2, row: 1, columnSpan: 4, rowSpan: 2 },
        flexPlacement: { order: 1, grow: 1, shrink: 1, basis: "auto" },
        style: {},
        liveValue: 50,
        enabled: true,
      },
    },
  ];

  const stacked = buildDashboardStackPlacements(items);
  assert.deepEqual(stacked[0]?.placement, {
    column: 1,
    row: 1,
    columnSpan: 2,
    rowSpan: 1,
  });
  assert.deepEqual(stacked[1]?.placement, {
    column: 1,
    row: 2,
    columnSpan: 4,
    rowSpan: 2,
  });
});
