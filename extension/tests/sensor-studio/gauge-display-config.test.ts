import assert from "node:assert/strict";
import test from "node:test";
import {
  coerceBarMeterConfig,
  coerceGaugeScaleReadoutConfig,
  coerceKnobConfig,
  coerceNumericDisplayConfig,
  coerceRadialGaugeConfig,
  gaugeZonesFromPreset,
  matchGaugeZonePreset,
  LEGACY_GAUGE_MIGRATION_TARGET,
  LEGACY_GAUGE_NODE_ID,
  migrateLegacyGaugeNodeData,
  normalizeGaugeHexColor,
  numericDisplayZonePresetBounds,
  radialGaugeArcGeometry,
  stepGaugeNeedleSmoothing,
} from "../../src/webview/sensor-studio/features/editor/nodes/display/gauge-display-config";
import {
  buildSparklinePolylinePoints,
  coerceSparklineConfig,
} from "../../src/webview/sensor-studio/features/editor/nodes/display/sparkline-display-config";
import { coerceLedIndicatorConfig } from "../../src/webview/sensor-studio/features/editor/nodes/display/led-indicator-config";

test("coerceGaugeScaleReadoutConfig applies defaults and clamps decimals", () => {
  const cfg = coerceGaugeScaleReadoutConfig({
    min: -10,
    max: 40,
    unit: "°C",
    decimals: 9,
    zones: [{ from: 0, to: 20, color: "#ffffff" }],
  });
  assert.equal(cfg.min, -10);
  assert.equal(cfg.max, 40);
  assert.equal(cfg.unit, "°C");
  assert.equal(cfg.decimals, 6);
  assert.equal(cfg.zones.length, 1);
  assert.equal(cfg.zones[0]?.color, "#ffffff");
});

test("gaugeZonesFromPreset maps traffic light to current scale", () => {
  const zones = gaugeZonesFromPreset("traffic", 0, 200);
  assert.equal(zones.length, 3);
  assert.equal(zones[0]?.from, 0);
  assert.equal(zones[0]?.to, 120);
  assert.equal(zones[2]?.to, 200);
});

test("matchGaugeZonePreset resolves preset templates and custom edits", () => {
  const traffic = gaugeZonesFromPreset("traffic", 0, 100);
  assert.equal(matchGaugeZonePreset(traffic, 0, 100), "traffic");
  assert.equal(matchGaugeZonePreset(gaugeZonesFromPreset("cold-hot", 0, 100), 0, 100), "cold-hot");
  assert.equal(
    matchGaugeZonePreset([{ from: 0, to: 50, color: "#ff00ff" }], 0, 100),
    "custom",
  );
});

test("normalizeGaugeHexColor rejects invalid values", () => {
  assert.equal(normalizeGaugeHexColor("cyan", "#112233"), "#112233");
  assert.equal(normalizeGaugeHexColor("#aabbcc", "#112233"), "#aabbcc");
});

test("coerceRadialGaugeConfig defaults appearance flags", () => {
  const cfg = coerceRadialGaugeConfig({ min: 0, max: 100 });
  assert.equal(cfg.arcPreset, "automotive270");
  assert.equal(cfg.showFaceplate, true);
  assert.equal(cfg.showNeedle, true);
  assert.equal(cfg.showDigitalValue, true);
});

test("radialGaugeArcGeometry semicircle180", () => {
  const geom = radialGaugeArcGeometry("semicircle180");
  assert.equal(geom.startDeg, 180);
  assert.equal(geom.sweepDeg, 180);
});

test("coerceBarMeterConfig clamps decimals and preserves orientation", () => {
  const cfg = coerceBarMeterConfig({
    min: 0,
    max: 10,
    decimals: 8,
    orientation: "horizontal",
    showPeakHold: false,
    fillSmoothingMs: 7500,
  });
  assert.equal(cfg.decimals, 4);
  assert.equal(cfg.orientation, "horizontal");
  assert.equal(cfg.showPeakHold, false);
  assert.equal(cfg.fillSmoothingMs, 5000);
});

test("coerceNumericDisplayConfig and zone preset bounds", () => {
  const cfg = coerceNumericDisplayConfig({ label: "P", decimals: 9 });
  assert.equal(cfg.label, "P");
  assert.equal(cfg.decimals, 6);
  assert.equal(cfg.zones.length, 3);
  const bounds = numericDisplayZonePresetBounds(cfg);
  assert.equal(bounds.min, 0);
  assert.equal(bounds.max, 100);
});

test("coerceKnobConfig clamps value into range", () => {
  const cfg = coerceKnobConfig({ min: 0, max: 10, value: 99, step: 0.5 });
  assert.equal(cfg.value, 10);
  assert.equal(cfg.step, 0.5);
});

test("stepGaugeNeedleSmoothing moves toward target", () => {
  const next = stepGaugeNeedleSmoothing(0, 100, 100, 200);
  assert.ok(next > 0 && next < 100);
  assert.equal(stepGaugeNeedleSmoothing(50, 50, 16, 0), 50);
});

test("coerceRadialGaugeConfig clamps needle smoothing ms", () => {
  const cfg = coerceRadialGaugeConfig({ needleSmoothingMs: 99999 });
  assert.equal(cfg.needleSmoothingMs, 5000);
});

test("coerceRadialGaugeConfig setpoint defaults and clamp", () => {
  const cfg = coerceRadialGaugeConfig({
    min: 0,
    max: 100,
    showSetpoint: true,
    setpoint: 150,
    setpointColor: "#aabbcc",
  });
  assert.equal(cfg.showSetpoint, true);
  assert.equal(cfg.setpoint, 100);
  assert.equal(cfg.setpointColor, "#aabbcc");
});

test("migrateLegacyGaugeNodeData maps to horizontal bar meter", () => {
  const migrated = migrateLegacyGaugeNodeData({
    nodeId: LEGACY_GAUGE_NODE_ID,
    defaultConfig: { unit: "V", decimals: 2 },
  });
  assert.equal(migrated.nodeId, LEGACY_GAUGE_MIGRATION_TARGET);
  assert.equal(migrated.defaultConfig?.min, -1);
  assert.equal(migrated.defaultConfig?.max, 1);
  assert.equal(migrated.defaultConfig?.orientation, "horizontal");
  assert.equal(migrated.defaultConfig?.unit, "V");
});

test("coerceSparklineConfig and polyline builder", () => {
  const cfg = coerceSparklineConfig({ historySize: 999, strokeWidth: 12 });
  assert.equal(cfg.historySize, 512);
  assert.equal(cfg.strokeWidth, 8);
  const pts = buildSparklinePolylinePoints([0, 1, -1], 24);
  assert.ok(pts.includes("100.00"));
});

test("coerceLedIndicatorConfig normalizes colors", () => {
  const cfg = coerceLedIndicatorConfig({ onColor: "#ff0000", threshold: 2 });
  assert.equal(cfg.onColor, "#ff0000");
  assert.equal(cfg.threshold, 2);
});
