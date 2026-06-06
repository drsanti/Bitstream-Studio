import assert from "node:assert/strict";
import test from "node:test";

import {
  exportAudioMachinePresetJson,
  parseAudioMachinePresetJson,
} from "../../src/webview/sensor-studio/core/audio/audio-machine-preset-export";

test("export and import motor preset roundtrip", () => {
  const cfg = {
    family: "motor",
    preset: "ev-motor",
    speed: 0.4,
    load: 0.3,
    gain: 0.11,
    whineBaseHz: 60,
    whineSpanHz: 900,
    harmonicMix: 0.1,
    rippleMix: 0.12,
    noiseMix: 0.03,
  };
  const json = exportAudioMachinePresetJson(cfg, { label: "EV demo" });
  const parsed = parseAudioMachinePresetJson(json);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) {
    return;
  }
  assert.equal(parsed.fields.family, "motor");
  assert.equal(parsed.fields.preset, "ev-motor");
  assert.equal(parsed.fields.speed, 0.4);
  assert.equal(parsed.fields.whineSpanHz, 900);
});

test("parse rejects unknown schema", () => {
  const result = parseAudioMachinePresetJson(JSON.stringify({ schema: "other", version: 1 }));
  assert.equal(result.ok, false);
});

test("export industrial layers", () => {
  const json = exportAudioMachinePresetJson({
    family: "machine",
    preset: "press",
    speed: 0.2,
    load: 0.5,
    gain: 0.12,
    cycleBaseHz: 0.5,
    cycleSpanHz: 2.5,
    frictionMix: 0.3,
    clankMix: 0.42,
  });
  const parsed = parseAudioMachinePresetJson(json);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) {
    return;
  }
  assert.equal(parsed.fields.family, "machine");
  assert.equal(parsed.fields.clankMix, 0.42);
});
