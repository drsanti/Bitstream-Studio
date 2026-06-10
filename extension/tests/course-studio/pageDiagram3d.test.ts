import assert from "node:assert/strict";
import test from "node:test";

import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";

test("parsePageV1 accepts scene-3d block with documentId", () => {
  const page = parsePageV1({
    version: 1,
    id: "test-page",
    title: "Test",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [
      {
        id: "heading-1",
        kind: "heading",
        placement: { column: 1, row: 1, columnSpan: 12, rowSpan: 2 },
        title: "Title",
      },
      {
        id: "scene-1",
        kind: "scene-3d",
        placement: { column: 1, row: 3, columnSpan: 5, rowSpan: 4 },
        documentId: "pilot-bmi-pcb-orientation",
        caption: "PCB live",
      },
    ],
  });

  const block = page.blocks.find((b) => b.kind === "scene-3d");
  assert.ok(block != null && block.kind === "scene-3d");
  assert.equal(block.documentId, "pilot-bmi-pcb-orientation");
  assert.equal(block.caption, "PCB live");
});

test("parsePageV1 migrates legacy diagram-3d blocks to scene-3d", () => {
  const page = parsePageV1({
    version: 1,
    id: "test-page",
    title: "Test",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [
      {
        id: "heading-1",
        kind: "heading",
        placement: { column: 1, row: 1, columnSpan: 12, rowSpan: 2 },
        title: "Title",
      },
      {
        id: "scene-1",
        kind: "diagram-3d",
        placement: { column: 1, row: 3, columnSpan: 5, rowSpan: 4 },
      },
    ],
  });

  const block = page.blocks.find((b) => b.kind === "scene-3d");
  assert.ok(block != null && block.kind === "scene-3d");
  assert.equal(block.documentId, "pilot-bmi-pcb-orientation");
});
