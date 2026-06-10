import assert from "node:assert/strict";
import test from "node:test";

import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";
import { listCourseScene3dPaneTargets } from "../../src/webview/course-studio/maintainer/courseScene3dPaneTargets";
import pilotPageJson from "../../src/webview/course-studio/content/pilot-bmi-accel-theory.page.v1.json";

test("listCourseScene3dPaneTargets includes scene-3d blocks only", () => {
  const page = parsePageV1(pilotPageJson);
  const targets = listCourseScene3dPaneTargets(page);

  assert.equal(targets.length, 1);
  const scene = targets.find((entry) => entry.blockId === "pcb-scene");
  assert.ok(scene != null && scene.kind === "scene-3d");
});
