import assert from "node:assert/strict";
import test from "node:test";
import {
  ANIMATION_LAB_TWIN_TAG_PRESETS,
  DEFAULT_TWIN_TAG_PRESET_ID,
  resolveTwinTagPresetDef,
  resolveTwinTagPresetId,
} from "../../src/webview/bitstream-app/components/animation-lab/animation-lab-twin-tag-presets.js";
import { resolveTwinTagStyle } from "../../src/webview/bitstream-app/components/animation-lab/animation-lab-twin-tag-style.types.js";

test("resolveTwinTagPresetId defaults to industrial HUD", () => {
  assert.equal(resolveTwinTagPresetId(undefined), DEFAULT_TWIN_TAG_PRESET_ID);
  assert.equal(resolveTwinTagPresetId({}), DEFAULT_TWIN_TAG_PRESET_ID);
  assert.equal(resolveTwinTagPresetId({ presetId: "compact-chip" }), "compact-chip");
});

test("resolveTwinTagStyle includes preset on resolved tag", () => {
  const style = resolveTwinTagStyle("Motor", { presetId: "minimal-glass" }, undefined);
  assert.equal(style.presetId, "minimal-glass");
  assert.equal(resolveTwinTagPresetDef({ presetId: style.presetId }).layout, "minimal");
});

test("extended presets resolve layout variants", () => {
  assert.equal(resolveTwinTagPresetDef({ presetId: "amber-phosphor" }).layout, "industrial");
  assert.equal(resolveTwinTagPresetDef({ presetId: "wireframe-outline" }).layout, "wireframe");
  assert.equal(ANIMATION_LAB_TWIN_TAG_PRESETS.length, 7);
});

test("bracket tactical preset uses corner icon placement", () => {
  assert.equal(
    resolveTwinTagPresetDef({ presetId: "bracket-tactical" }).iconPlacement,
    "corner",
  );
});
