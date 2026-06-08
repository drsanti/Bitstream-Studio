import assert from "node:assert/strict";
import test from "node:test";

import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";

test("parsePageV1 accepts diagram-3d block with sceneId", () => {
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
        sceneId: "bmi-pcb-orientation",
        caption: "PCB live",
      },
    ],
  });

  const block = page.blocks.find((b) => b.kind === "diagram-3d");
  assert.ok(block != null && block.kind === "diagram-3d");
  assert.equal(block.sceneId, "bmi-pcb-orientation");
  assert.equal(block.caption, "PCB live");
});

test("parsePageV1 defaults diagram-3d sceneId when omitted", () => {
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

  const block = page.blocks.find((b) => b.kind === "diagram-3d");
  assert.ok(block != null && block.kind === "diagram-3d");
  assert.equal(block.sceneId, "bmi-pcb-orientation");
});
