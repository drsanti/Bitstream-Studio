import assert from "node:assert/strict";
import test from "node:test";

import { clampAnalyserFftSize } from "../../src/webview/sensor-studio/core/audio/clamp-analyser-fft-size";

test("clampAnalyserFftSize returns nearest power of two", () => {
  assert.equal(clampAnalyserFftSize(2047), 2048);
  assert.equal(clampAnalyserFftSize(2048), 2048);
  assert.equal(clampAnalyserFftSize(3000), 2048);
});

test("clampAnalyserFftSize clamps to analyser bounds", () => {
  assert.equal(clampAnalyserFftSize(16), 32);
  assert.equal(clampAnalyserFftSize(65536), 32768);
});
