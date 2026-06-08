import assert from "node:assert/strict";
import test from "node:test";

import { modelOutlinerSearchMatches } from "../../src/webview/sensor-studio/features/editor/model-outliner/model-outliner-search-highlight";

test("modelOutlinerSearchMatches is case-insensitive", () => {
  assert.equal(modelOutlinerSearchMatches("Main_body_3", "body"), true);
  assert.equal(modelOutlinerSearchMatches("arms_1", "ARM"), true);
  assert.equal(modelOutlinerSearchMatches("Gimbal1", "wing"), false);
  assert.equal(modelOutlinerSearchMatches("Walk", ""), true);
});
