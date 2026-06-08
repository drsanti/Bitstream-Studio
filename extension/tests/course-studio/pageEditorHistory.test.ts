import assert from "node:assert/strict";
import { test } from "node:test";
import { loadPilotBmiAccelTheoryPage } from "../../src/webview/course-studio/content/loadPilotPage";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";
import {
  EMPTY_HISTORY_STACKS,
  pushHistorySnapshot,
  undoHistory,
} from "../../src/webview/course-studio/maintainer/historyStacks";

test("page grid undo restores prior block placement", () => {
  const before = loadPilotBmiAccelTheoryPage();
  const moved = parsePageV1({
    ...before,
    blocks: before.blocks.map((block) =>
      block.id === "live"
        ? { ...block, placement: { ...block.placement, column: 1, row: 20 } }
        : block,
    ),
  });
  const stacks = pushHistorySnapshot(EMPTY_HISTORY_STACKS, before);
  const undone = undoHistory(stacks, moved);
  assert.ok(undone.snapshot != null);
  const restored = undone.snapshot.blocks.find((block) => block.id === "live");
  const original = before.blocks.find((block) => block.id === "live");
  assert.equal(restored?.placement.row, original?.placement.row);
  assert.equal(restored?.placement.column, original?.placement.column);
});
