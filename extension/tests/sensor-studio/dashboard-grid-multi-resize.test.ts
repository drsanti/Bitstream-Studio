import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dashboardMultiGridResizeUpdates,
  previewDashboardMultiGridResize,
  resolveDashboardMultiResizeContext,
  unionDashboardPlacements,
} from "../../src/webview/sensor-studio/core/dashboard/dashboard-grid-editor-ops";
import type { DashboardSnapshotItemV1 } from "../../src/webview/sensor-studio/core/dashboard/dashboard-snapshot";

const topWidget = (id: string, placement: { column: number; row: number; columnSpan?: number; rowSpan?: number }) =>
  ({
    kind: "widget",
    widget: {
      sourceNodeId: id,
      placement: {
        columnSpan: 2,
        rowSpan: 1,
        ...placement,
      },
    },
  }) as DashboardSnapshotItemV1;

describe("dashboard-grid-multi-resize", () => {
  it("unionDashboardPlacements bounds all placements", () => {
    const union = unionDashboardPlacements([
      { column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
      { column: 4, row: 2, columnSpan: 3, rowSpan: 2 },
    ]);
    assert.deepEqual(union, { column: 1, row: 1, columnSpan: 6, rowSpan: 3 });
  });

  it("resolveDashboardMultiResizeContext requires same grid space", () => {
    const items = [topWidget("a", { column: 1, row: 1 }), topWidget("b", { column: 4, row: 1 })];
    const entries = [
      { sourceNodeId: "a", placement: items[0]!.widget.placement, groupParentId: null },
      { sourceNodeId: "b", placement: items[1]!.widget.placement, groupParentId: null },
    ];
    const ctx = resolveDashboardMultiResizeContext(entries);
    assert.ok(ctx != null);
    assert.deepEqual(ctx.unionPlacement, { column: 1, row: 1, columnSpan: 5, rowSpan: 1 });

    const mixed = [
      ...entries,
      { sourceNodeId: "c", placement: { column: 1, row: 1, columnSpan: 1, rowSpan: 1 }, groupParentId: "group-1" },
    ];
    assert.equal(resolveDashboardMultiResizeContext(mixed), null);
  });

  it("preview applies shared placement delta to each widget", () => {
    const entries = [
      {
        sourceNodeId: "a",
        placement: { column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
        groupParentId: null,
      },
      {
        sourceNodeId: "b",
        placement: { column: 4, row: 1, columnSpan: 2, rowSpan: 1 },
        groupParentId: null,
      },
    ];
    const baseUnion = { column: 1, row: 1, columnSpan: 5, rowSpan: 1 };
    const nextUnion = { column: 1, row: 1, columnSpan: 7, rowSpan: 2 };
    const preview = previewDashboardMultiGridResize({ entries, baseUnion, nextUnion });
    assert.deepEqual(preview.a, { column: 1, row: 1, columnSpan: 4, rowSpan: 2 });
    assert.deepEqual(preview.b, { column: 4, row: 1, columnSpan: 4, rowSpan: 2 });
  });

  it("dashboardMultiGridResizeUpdates skips unchanged placements", () => {
    const entries = [
      {
        sourceNodeId: "a",
        placement: { column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
        groupParentId: null,
      },
    ];
    const updates = dashboardMultiGridResizeUpdates({
      entries,
      baseUnion: { column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
      nextUnion: { column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
    });
    assert.equal(updates.length, 0);
  });
});
