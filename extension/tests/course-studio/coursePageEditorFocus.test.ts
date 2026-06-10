import assert from "node:assert/strict";
import test from "node:test";

import { initCourseDiagramRegistryFromPack } from "../../src/webview/course-studio/content/diagramRegistry";
import {
  courseWorkbenchOpenIconForBlock,
  courseWorkbenchOpenLabelForBlock,
  resolveCourseWorkbenchEditorTypeForBlock,
} from "../../src/webview/course-studio/maintainer/coursePageEditorFocus";
import { Box, PenLine } from "lucide-react";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";
import pilotPageJson from "../../src/webview/course-studio/content/pilot-bmi-accel-theory.page.v1.json";

initCourseDiagramRegistryFromPack();

test("resolveCourseWorkbenchEditorTypeForBlock keeps diagram-2d on diagram pane", () => {
  const page = parsePageV1(pilotPageJson);
  const orientation = page.blocks.find((block) => block.id === "orientation-diagram");
  assert.ok(orientation != null && orientation.kind === "diagram-2d");

  assert.equal(resolveCourseWorkbenchEditorTypeForBlock(orientation), "diagram");
  assert.equal(courseWorkbenchOpenLabelForBlock(orientation), "Open diagram editor");
  assert.equal(courseWorkbenchOpenIconForBlock(orientation), PenLine);
});

test("resolveCourseWorkbenchEditorTypeForBlock maps scene-3d to scene-3d editor", () => {
  const page = parsePageV1(pilotPageJson);
  const scene = page.blocks.find((block) => block.id === "pcb-scene");
  assert.ok(scene != null && scene.kind === "scene-3d");

  assert.equal(resolveCourseWorkbenchEditorTypeForBlock(scene), "scene-3d");
  assert.equal(courseWorkbenchOpenLabelForBlock(scene), "Open 3D Scene Editor");
  assert.equal(courseWorkbenchOpenIconForBlock(scene), Box);
});
