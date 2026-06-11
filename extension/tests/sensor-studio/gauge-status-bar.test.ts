import assert from "node:assert/strict";
import { test } from "node:test";
import {
  coerceNumericDisplayConfig,
  gaugeStatusBarFillBackground,
  gaugeStatusBarFillRatio,
  gaugeZoneSpectrumGradient,
  inferNumericDisplayScaleFromUnit,
} from "../../src/webview/sensor-studio/features/editor/nodes/display/gauge-display-config";

test("gaugeZoneSpectrumGradient spans zone colors left to right", () => {
  const bg = gaugeZoneSpectrumGradient([
    { from: 0, to: 60, color: "#22d3ee" },
    { from: 60, to: 80, color: "#fbbf24" },
    { from: 80, to: 100, color: "#f87171" },
  ]);
  assert.match(bg, /linear-gradient\(to right/);
  assert.match(bg, /#22d3ee/);
  assert.match(bg, /#f87171/);
});

test("gaugeStatusBarFillBackground uses accent gradient for flat zones", () => {
  const bg = gaugeStatusBarFillBackground(
    [{ from: -1e12, to: 1e12, color: "#eaf7ff" }],
    42,
  );
  assert.match(bg, /linear-gradient\(to right/);
  assert.match(bg, /#f5f5f5/);
  assert.match(bg, /--course-wb-gradient-from/);
  assert.match(bg, /--course-wb-gradient-to/);
});

test("gaugeStatusBarFillRatio maps value into min-max span", () => {
  assert.equal(gaugeStatusBarFillRatio(50, 0, 100), 0.5);
  assert.equal(gaugeStatusBarFillRatio(0, 0, 100), 0);
  assert.equal(gaugeStatusBarFillRatio(100, 0, 100), 1);
  assert.equal(gaugeStatusBarFillRatio(150, 0, 100), 1);
});

test("coerceNumericDisplayConfig infers 0-100 scale for %RH widgets", () => {
  const cfg = coerceNumericDisplayConfig({
    unit: "%RH",
    zones: [{ from: -1e12, to: 1e12, color: "#eaf7ff" }],
  });
  assert.equal(cfg.min, 0);
  assert.equal(cfg.max, 100);
});

test("inferNumericDisplayScaleFromUnit covers temperature", () => {
  const scale = inferNumericDisplayScaleFromUnit("°C");
  assert.equal(scale.min < scale.max, true);
  assert.equal(gaugeStatusBarFillRatio(20, scale.min, scale.max) > 0, true);
});
