import assert from "node:assert/strict";
import test from "node:test";

import { focusCourseScene3dPaneTarget } from "../../src/webview/course-studio/maintainer/focusCourseScene3dPaneTarget";
import { createPageBlock } from "../../src/webview/course-studio/maintainer/blockFactory";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";
import blankPageJson from "../../src/webview/course-studio/content/blank.page.v1.json";

test("focusCourseScene3dPaneTarget selects scene-3d block and focuses editor", () => {
  const page = parsePageV1(blankPageJson);
  const sceneBlock = createPageBlock("scene-3d", page, {
    documentId: "pilot-bmi-pcb-orientation",
  });
  const nextPage = parsePageV1({
    ...blankPageJson,
    blocks: [...page.blocks, sceneBlock],
  });

  let selectedId: string | null = null;
  let editorType: string | null = null;

  const focused = focusCourseScene3dPaneTarget(sceneBlock.id, {
    selectBlock: (blockId) => {
      selectedId = blockId;
    },
    focusWorkbenchEditor: (type) => {
      editorType = type;
    },
  }, nextPage);

  assert.equal(focused, true);
  assert.equal(selectedId, sceneBlock.id);
  assert.equal(editorType, "scene-3d");
});

test("focusCourseScene3dPaneTarget ignores non-scene blocks", () => {
  const page = parsePageV1(blankPageJson);
  const markdown = createPageBlock("markdown", page);
  const nextPage = parsePageV1({
    ...blankPageJson,
    blocks: [...page.blocks, markdown],
  });

  const focused = focusCourseScene3dPaneTarget(markdown.id, {
    selectBlock: () => {},
    focusWorkbenchEditor: () => {},
  }, nextPage);

  assert.equal(focused, false);
});
