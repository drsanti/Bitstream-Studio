import assert from "node:assert/strict";
import test from "node:test";

import { collectPageSceneDocumentIds } from "../../src/webview/course-studio/validate/pageGridValidate";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";

test("collectPageSceneDocumentIds returns scene-3d document ids", () => {
  const page = parsePageV1({
    version: 1,
    id: "scene-page",
    title: "Scene page",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [
      {
        id: "scene-a",
        kind: "scene-3d",
        placement: { column: 1, row: 1, columnSpan: 5, rowSpan: 4 },
        documentId: "pilot-bmi-pcb-orientation",
      },
      {
        id: "md",
        kind: "markdown",
        placement: { column: 6, row: 1, columnSpan: 4, rowSpan: 2 },
        markdown: "Hello",
      },
    ],
  });

  assert.deepEqual(collectPageSceneDocumentIds(page), ["pilot-bmi-pcb-orientation"]);
});
