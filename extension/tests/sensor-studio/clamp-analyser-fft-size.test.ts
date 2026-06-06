import { describe, expect, it } from "vitest";
import { clampAnalyserFftSize } from "../../src/webview/sensor-studio/core/audio/clamp-analyser-fft-size";

describe("clampAnalyserFftSize", () => {
  it("returns nearest power of two", () => {
    expect(clampAnalyserFftSize(2047)).toBe(2048);
    expect(clampAnalyserFftSize(2048)).toBe(2048);
    expect(clampAnalyserFftSize(3000)).toBe(4096);
  });

  it("clamps to analyser bounds", () => {
    expect(clampAnalyserFftSize(16)).toBe(32);
    expect(clampAnalyserFftSize(65536)).toBe(32768);
  });
});
