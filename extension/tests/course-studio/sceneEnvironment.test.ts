import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SCENE_ENVIRONMENT,
  resolveSceneEnvironmentSettings,
} from "../../src/webview/course-studio/schemas/scene.v1";
import { buildCourseSceneCubemapSelectOptions } from "../../src/webview/course-studio/runtime/scene/sceneCubemapSelectOptions";

test("resolveSceneEnvironmentSettings merges partial settings with defaults", () => {
  const resolved = resolveSceneEnvironmentSettings({
    showGrid: false,
    environmentPresetIndex: 2,
  });
  assert.equal(resolved.showGrid, false);
  assert.equal(resolved.environmentPresetIndex, 2);
  assert.equal(resolved.contactShadows, DEFAULT_SCENE_ENVIRONMENT.contactShadows);
  assert.equal(resolved.backgroundColor, DEFAULT_SCENE_ENVIRONMENT.backgroundColor);
});

test("buildCourseSceneCubemapSelectOptions returns indexed preset labels", () => {
  const options = buildCourseSceneCubemapSelectOptions();
  assert.ok(options.length >= 1);
  assert.equal(options[0]?.value, "0");
  assert.ok(typeof options[0]?.label === "string" && options[0].label.length > 0);
});
