import assert from "node:assert/strict";
import test from "node:test";
import { BMI270_MASK } from "../../src/bitstream2/domains/sensors/bmi270";
import {
  bmi270DraftForOutputPreset,
  BMI270_PROFILE_ALL_MASK,
  BMI270_PROFILE_RAW_MASK,
  isBmi270CustomOutput,
  resolveBmi270OutputPresetId,
} from "../../src/webview/bitstream-app/lib/bmi270OutputProfiles";

test("resolveBmi270OutputPresetId — three presets", () => {
  assert.equal(resolveBmi270OutputPresetId(BMI270_PROFILE_RAW_MASK, "raw"), "raw");
  assert.equal(
    resolveBmi270OutputPresetId(BMI270_MASK.EULER | BMI270_MASK.QUAT, "fusion"),
    "fusion",
  );
  assert.equal(resolveBmi270OutputPresetId(BMI270_PROFILE_ALL_MASK, "hybrid"), "hybrid");
});

test("resolveBmi270OutputPresetId — null when mask/mode mismatch", () => {
  assert.equal(resolveBmi270OutputPresetId(0x03, "raw"), null);
  assert.equal(resolveBmi270OutputPresetId(BMI270_PROFILE_ALL_MASK, "raw"), null);
});

test("isBmi270CustomOutput", () => {
  assert.equal(isBmi270CustomOutput(BMI270_PROFILE_RAW_MASK, "raw"), false);
  assert.equal(isBmi270CustomOutput(0x03, "raw"), true);
});

test("bmi270DraftForOutputPreset — all channels", () => {
  const draft = bmi270DraftForOutputPreset("hybrid");
  assert.equal(draft.streamMode, "hybrid");
  assert.equal(draft.mask, 0x1f);
});
