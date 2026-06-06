import { describe, expect, it } from "vitest";
import {
  audioScopeThemePresetFields,
  coerceAudioScopeDisplayConfig,
  hexColorWithAlpha,
} from "../../src/webview/sensor-studio/features/editor/nodes/audio/audio-scope-display-config";

describe("coerceAudioScopeDisplayConfig", () => {
  it("applies defaults for empty config", () => {
    const d = coerceAudioScopeDisplayConfig({});
    expect(d.themePreset).toBe("studio-cyan");
    expect(d.waveformColorHex).toBe("#22d3ee");
    expect(d.freqBarCount).toBe(64);
  });

  it("clamps bar count and gains", () => {
    const d = coerceAudioScopeDisplayConfig({
      freqBarCount: 200,
      waveformGain: 10,
      spectrumGain: 0,
    });
    expect(d.freqBarCount).toBe(128);
    expect(d.waveformGain).toBe(4);
    expect(d.spectrumGain).toBe(0.25);
  });
});

describe("audioScopeThemePresetFields", () => {
  it("returns phosphor palette fields", () => {
    const fields = audioScopeThemePresetFields("phosphor");
    expect(fields.themePreset).toBe("phosphor");
    expect(fields.waveformColorHex).toBe("#4ade80");
  });
});

describe("hexColorWithAlpha", () => {
  it("builds rgba from hex", () => {
    expect(hexColorWithAlpha("#22d3ee", 0.5)).toBe("rgba(34, 211, 238, 0.5)");
  });
});
