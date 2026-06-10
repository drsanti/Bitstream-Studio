import assert from "node:assert/strict";
import test from "node:test";

import {
  findOpenPlacement,
  formatPlacementOccupancyHint,
} from "../../src/webview/course-studio/maintainer/blockPlacement";
import { loadPilotBmiAccelTheoryPage } from "../../src/webview/course-studio/content/loadPilotPage";

test("formatPlacementOccupancyHint summarizes column and row spans", () => {
  assert.equal(
    formatPlacementOccupancyHint({ column: 1, row: 12, columnSpan: 12, rowSpan: 7 }),
    "Occupies columns 1–12, rows 12–18 (12×7 cells)",
  );
});

test("findOpenPlacement avoids occupied cells", () => {
  const page = loadPilotBmiAccelTheoryPage();
  const placement = findOpenPlacement(page, { columnSpan: 2, rowSpan: 1 });
  const keys = new Set<string>();
  for (const block of page.blocks) {
    for (let r = block.placement.row; r < block.placement.row + block.placement.rowSpan; r += 1) {
      for (
        let c = block.placement.column;
        c < block.placement.column + block.placement.columnSpan;
        c += 1
      ) {
        keys.add(`${r}:${c}`);
      }
    }
  }
  for (let r = placement.row; r < placement.row + placement.rowSpan; r += 1) {
    for (let c = placement.column; c < placement.column + placement.columnSpan; c += 1) {
      assert.equal(keys.has(`${r}:${c}`), false);
    }
  }
});
