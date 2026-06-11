import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyDashboardGridMoveDelta,
  dashboardGridMoveDelta,
  nudgeDashboardMultiGridMove,
  previewDashboardMultiGridMove,
  resolveDashboardSelectionMoveEntries,
} from "../../src/webview/sensor-studio/core/dashboard/dashboard-grid-editor-ops";
import type { DashboardSnapshotItemV1 } from "../../src/webview/sensor-studio/core/dashboard/dashboard-snapshot";

const topWidget = (id: string, placement: { column: number; row: number }) =>
  ({
    kind: "widget",
    widget: {
      sourceNodeId: id,
      placement: { columnSpan: 2, rowSpan: 1, ...placement },
    },
  }) as DashboardSnapshotItemV1;

describe("dashboard-grid-multi-move", () => {
  it("resolves top-level selection entries", () => {
    const items = [topWidget("a", { column: 1, row: 1 }), topWidget("b", { column: 4, row: 1 })];
    const entries = resolveDashboardSelectionMoveEntries(items, ["a", "b"]);
    assert.equal(entries.length, 2);
    assert.equal(entries[0]?.groupParentId, null);
  });

  it("preview applies shared delta from anchor", () => {
    const entries = resolveDashboardSelectionMoveEntries(
      [topWidget("a", { column: 1, row: 1 }), topWidget("b", { column: 4, row: 1 })],
      ["a", "b"],
    );
    const preview = previewDashboardMultiGridMove({
      entries,
      anchorSourceNodeId: "a",
      anchorTargetRow: 2,
      anchorTargetColumn: 2,
    });
    assert.deepEqual(preview.a, { row: 2, column: 2 });
    assert.deepEqual(preview.b, { row: 2, column: 5 });
  });

  it("nudge moves all or none when blocked", () => {
    const items = [
      topWidget("a", { column: 1, row: 1 }),
      topWidget("b", { column: 3, row: 1 }),
      topWidget("blocker", { column: 2, row: 1 }),
    ];
    const entries = resolveDashboardSelectionMoveEntries(items, ["a", "b"]);
    const blocked = nudgeDashboardMultiGridMove({
      entries,
      direction: "right",
      displayItems: items,
      gridColumns: 12,
    });
    assert.equal(blocked, null);

    const moved = nudgeDashboardMultiGridMove({
      entries: resolveDashboardSelectionMoveEntries(items, ["a"]),
      direction: "down",
      displayItems: items,
      gridColumns: 12,
    });
    assert.deepEqual(moved, [{ sourceNodeId: "a", placement: { column: 1, row: 2, columnSpan: 2, rowSpan: 1 } }]);
  });

  it("dashboardGridMoveDelta computes offsets", () => {
    assert.deepEqual(
      dashboardGridMoveDelta({ fromRow: 1, fromColumn: 2, toRow: 3, toColumn: 5 }),
      { rowDelta: 2, columnDelta: 3 },
    );
    const next = applyDashboardGridMoveDelta(
      { column: 2, row: 1, columnSpan: 2, rowSpan: 1 },
      { rowDelta: 1, columnDelta: -1 },
    );
    assert.deepEqual(next, { column: 1, row: 2, columnSpan: 2, rowSpan: 1 });
  });
});
