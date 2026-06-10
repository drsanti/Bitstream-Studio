import assert from "node:assert/strict";
import test from "node:test";
import { BMI270_MASK } from "../../src/bitstream2/domains/sensors/bmi270";
import {
  bmi270DraftForOutputPreset,
  BMI270_PROFILE_ALL_MASK,
  BMI270_PROFILE_FUSION_MASK,
  BMI270_PROFILE_RAW_MASK,
  inferBmi270StreamModeFromMask,
  isBmi270CustomOutput,
  resolveBmi270OutputPresetDisplayState,
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

test("resolveBmi270OutputPresetDisplayState — infers mode after refresh before MODE GET", () => {
  const state = resolveBmi270OutputPresetDisplayState({
    draftMask: 0x1f,
    firmwareMask: BMI270_PROFILE_RAW_MASK,
    draftStreamMode: "hybrid",
    firmwareStreamMode: null,
    maskUserDirty: false,
    streamModeUserDirty: false,
    outputProfileUserEdited: false,
  });
  assert.equal(state.presetId, "raw");
  assert.equal(state.streamMode, "raw");
});

test("resolveBmi270OutputPresetDisplayState — MODE GET is authoritative when not editing", () => {
  const state = resolveBmi270OutputPresetDisplayState({
    draftMask: BMI270_PROFILE_RAW_MASK,
    firmwareMask: BMI270_PROFILE_ALL_MASK,
    draftStreamMode: "raw",
    firmwareStreamMode: "hybrid",
    maskUserDirty: false,
    streamModeUserDirty: false,
    outputProfileUserEdited: false,
  });
  assert.equal(state.presetId, "hybrid");
});

test("resolveBmi270OutputPresetDisplayState — preset click before mask prop catches up", () => {
  const state = resolveBmi270OutputPresetDisplayState({
    draftMask: BMI270_PROFILE_ALL_MASK,
    firmwareMask: BMI270_PROFILE_ALL_MASK,
    draftStreamMode: "fusion",
    firmwareStreamMode: "hybrid",
    maskUserDirty: false,
    streamModeUserDirty: false,
    outputProfileUserEdited: true,
  });
  assert.equal(state.presetId, "fusion");
});

test("resolveBmi270OutputPresetDisplayState — uses draft while user edits", () => {
  const state = resolveBmi270OutputPresetDisplayState({
    draftMask: BMI270_PROFILE_FUSION_MASK,
    firmwareMask: BMI270_PROFILE_RAW_MASK,
    draftStreamMode: "fusion",
    firmwareStreamMode: "raw",
    maskUserDirty: true,
    streamModeUserDirty: true,
    outputProfileUserEdited: true,
  });
  assert.equal(state.presetId, "fusion");
});

test("inferBmi270StreamModeFromMask — preset masks", () => {
  assert.equal(inferBmi270StreamModeFromMask(BMI270_PROFILE_RAW_MASK), "raw");
  assert.equal(inferBmi270StreamModeFromMask(BMI270_PROFILE_ALL_MASK), "hybrid");
  assert.equal(inferBmi270StreamModeFromMask(0x03), null);
});

test("bmi270DraftForOutputPreset — all channels", () => {
  const draft = bmi270DraftForOutputPreset("hybrid");
  assert.equal(draft.streamMode, "hybrid");
  assert.equal(draft.mask, 0x1f);
});
