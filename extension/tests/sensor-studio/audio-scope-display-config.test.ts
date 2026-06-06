import assert from "node:assert/strict";
import test from "node:test";

import {
  audioScopeThemePresetFields,
  coerceAudioScopeDisplayConfig,
  hexColorWithAlpha,
} from "../../src/webview/sensor-studio/features/editor/nodes/audio/audio-scope-display-config";

test("coerceAudioScopeDisplayConfig applies defaults for empty config", () => {
  const d = coerceAudioScopeDisplayConfig({});
  assert.equal(d.themePreset, "studio-cyan");
  assert.equal(d.waveformColorHex, "#22d3ee");
  assert.equal(d.freqBarCount, 64);
});

test("coerceAudioScopeDisplayConfig clamps bar count and gains", () => {
  const d = coerceAudioScopeDisplayConfig({
    freqBarCount: 200,
    waveformGain: 10,
    spectrumGain: 0,
  });
  assert.equal(d.freqBarCount, 128);
  assert.equal(d.waveformGain, 4);
  assert.equal(d.spectrumGain, 0.25);
});

test("audioScopeThemePresetFields returns phosphor palette fields", () => {
  const fields = audioScopeThemePresetFields("phosphor");
  assert.equal(fields.themePreset, "phosphor");
  assert.equal(fields.waveformColorHex, "#4ade80");
});

test("hexColorWithAlpha builds rgba from hex", () => {
  assert.equal(hexColorWithAlpha("#22d3ee", 0.5), "rgba(34, 211, 238, 0.5)");
});
