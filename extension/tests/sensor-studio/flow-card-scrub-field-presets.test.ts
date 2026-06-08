import assert from "node:assert/strict";
import test from "node:test";

import {
  FLOW_CARD_SCRUB_SETTINGS_KEY,
  INSPECTOR_SCRUB_APPEARANCE,
  INSPECTOR_SCRUB_SETTINGS_KEY,
  INSPECTOR_SCRUB_STORED_DEFAULTS,
} from "../../src/webview/sensor-studio/features/editor/components/inspector/inspector-scrub-field-presets";

test("flow card scrub uses dedicated settings key", () => {
  assert.notEqual(FLOW_CARD_SCRUB_SETTINGS_KEY, INSPECTOR_SCRUB_SETTINGS_KEY);
  assert.equal(FLOW_CARD_SCRUB_SETTINGS_KEY, "flow-card-numeric");
});

test("flow card scrub defaults expose full step and lock chrome", () => {
  assert.equal(INSPECTOR_SCRUB_APPEARANCE.variant, "full");
  assert.equal(INSPECTOR_SCRUB_APPEARANCE.stepButtonsVisibility, "always");
  assert.equal(INSPECTOR_SCRUB_APPEARANCE.lockIconVisibility, "always");
  assert.equal(INSPECTOR_SCRUB_STORED_DEFAULTS.appearance?.variant, "full");
});
