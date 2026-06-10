import assert from "node:assert/strict";
import test from "node:test";

import { createPageBlock } from "../../src/webview/course-studio/maintainer/blockFactory";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";

test("createPageBlock avoids duplicate scene-3d ids already on the page", () => {
  const page = parsePageV1({
    version: 1,
    id: "scene-id-test",
    title: "Scene ids",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [
      {
        id: "scene-3d-1",
        kind: "scene-3d",
        placement: { column: 1, row: 1, columnSpan: 5, rowSpan: 4 },
        documentId: "scene-existing",
        caption: "Existing",
      },
    ],
  });

  const next = createPageBlock("scene-3d", page, { documentId: "scene-new" });
  assert.equal(next.id, "scene-3d-2");
});

test("createPageBlock increments from highest matching kind suffix", () => {
  const page = parsePageV1({
    version: 1,
    id: "scene-id-test-2",
    title: "Scene ids",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [
      {
        id: "scene-3d-3",
        kind: "scene-3d",
        placement: { column: 1, row: 1, columnSpan: 5, rowSpan: 4 },
        documentId: "scene-a",
      },
      {
        id: "pcb-scene",
        kind: "scene-3d",
        placement: { column: 6, row: 1, columnSpan: 5, rowSpan: 4 },
        documentId: "scene-b",
      },
    ],
  });

  const next = createPageBlock("scene-3d", page, { documentId: "scene-c" });
  assert.equal(next.id, "scene-3d-4");
});
