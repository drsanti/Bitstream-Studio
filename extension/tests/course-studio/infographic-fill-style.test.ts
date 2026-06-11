import assert from "node:assert/strict";
import test from "node:test";

import {
  INFOGRAPHIC_HUMIDITY_GRADIENT,
  INFOGRAPHIC_THERMAL_GRADIENT,
  infographicFillAccentColor,
  infographicFillCssGradient,
  resolveInfographicFillGradientStops,
} from "../../src/webview/course-studio/ui/catalog/infographics/infographicFillStyle";
import { readInfographicSkinConfig } from "../../src/webview/course-studio/schemas/infographicVisualPreset.v1";

test("resolveInfographicFillGradientStops uses thermal defaults for thermometer", () => {
  const config = readInfographicSkinConfig({});
  const stops = resolveInfographicFillGradientStops(config, "thermometer-mercury");
  assert.equal(stops.from, INFOGRAPHIC_THERMAL_GRADIENT.from);
  assert.equal(stops.mid, INFOGRAPHIC_THERMAL_GRADIENT.mid);
  assert.equal(stops.to, INFOGRAPHIC_THERMAL_GRADIENT.to);
});

test("resolveInfographicFillGradientStops uses humidity defaults for droplet", () => {
  const config = readInfographicSkinConfig({});
  const stops = resolveInfographicFillGradientStops(config, "droplet-fill");
  assert.equal(stops.from, INFOGRAPHIC_HUMIDITY_GRADIENT.from);
  assert.equal(stops.mid, INFOGRAPHIC_HUMIDITY_GRADIENT.mid);
  assert.equal(stops.to, INFOGRAPHIC_HUMIDITY_GRADIENT.to);
});

test("resolveInfographicFillGradientStops honors style overrides", () => {
  const config = readInfographicSkinConfig({});
  const stops = resolveInfographicFillGradientStops(config, "thermometer-mercury", {
    fillGradientFrom: "#111111",
    fillGradientMid: "#222222",
    fillGradientTo: "#333333",
  });
  assert.deepEqual(stops, { from: "#111111", mid: "#222222", to: "#333333" });
});

test("infographicFillCssGradient builds three-stop vertical gradient", () => {
  const css = infographicFillCssGradient(INFOGRAPHIC_THERMAL_GRADIENT, "to top");
  assert.match(css, /linear-gradient\(to top, #fbbf24, #f97316, #ef4444\)/);
});

test("infographicFillAccentColor picks warmer stop as ratio rises", () => {
  assert.equal(infographicFillAccentColor(INFOGRAPHIC_THERMAL_GRADIENT, 0.1), "#fbbf24");
  assert.equal(infographicFillAccentColor(INFOGRAPHIC_THERMAL_GRADIENT, 0.5), "#f97316");
  assert.equal(infographicFillAccentColor(INFOGRAPHIC_THERMAL_GRADIENT, 0.9), "#ef4444");
});
