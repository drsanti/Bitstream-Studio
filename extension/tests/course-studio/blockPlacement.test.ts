import assert from "node:assert/strict";
import test from "node:test";

import { findOpenPlacement } from "../../src/webview/course-studio/maintainer/blockPlacement";
import { loadPilotBmiAccelTheoryPage } from "../../src/webview/course-studio/content/loadPilotPage";

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
