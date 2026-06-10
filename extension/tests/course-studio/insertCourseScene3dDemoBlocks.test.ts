import assert from "node:assert/strict";
import test from "node:test";

import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";
import { insertCourseScene3dBlock } from "../../src/webview/course-studio/maintainer/insertCourseScene3dDemoBlocks";
import blankPageJson from "../../src/webview/course-studio/content/blank.page.v1.json";

test("insertCourseScene3dBlock creates scene-3d block with bundled documentId", () => {
  const page = parsePageV1(blankPageJson);
  const block = insertCourseScene3dBlock(page);

  assert.equal(block.kind, "scene-3d");
  assert.equal(block.documentId, "pilot-bmi-pcb-orientation");
  assert.equal(block.caption, "PCB orientation");
  assert.ok(block.placement.columnSpan >= 1);
});
