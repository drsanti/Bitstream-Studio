import assert from "node:assert/strict";
import test from "node:test";
import {
  convertPressureHpaToUnit,
  formatPressureFromWireHpa,
  pressureHpaFromWireSecondaryX100,
  resolvePressureGaugeLimits,
  resolvePressureGaugeLimitsHpa,
} from "../../src/webview/bitstream-app/telemetry/pressureDisplay";

test("pressureHpaFromWireSecondaryX100", () => {
  assert.equal(pressureHpaFromWireSecondaryX100(10054), 1005.4);
});

test("convertPressureHpaToUnit", () => {
  assert.equal(convertPressureHpaToUnit(1013.25, "hpa"), 1013.25);
  assert.ok(Math.abs(convertPressureHpaToUnit(1013.25, "kpa") - 101.325) < 1e-6);
  assert.ok(Math.abs(convertPressureHpaToUnit(1013.25, "pa") - 101325) < 1e-3);
});

test("formatPressureFromWireHpa", () => {
  const row = formatPressureFromWireHpa(1005.4, "kpa", 2);
  assert.equal(row.text, "100.54");
  assert.equal(row.unitLabel, "kPa");
});

test("resolvePressureGaugeLimits sea-level and full", () => {
  const sea = resolvePressureGaugeLimitsHpa("sea-level", 1000);
  assert.equal(sea.gaugeMin, 900);
  assert.equal(sea.gaugeMax, 1100);

  const full = resolvePressureGaugeLimitsHpa("full", 1000);
  assert.equal(full.gaugeMin, 300);
  assert.equal(full.gaugeMax, 1200);
});

test("resolvePressureGaugeLimits converts unit for gauge", () => {
  const kpa = resolvePressureGaugeLimits("sea-level", 1000, "kpa");
  assert.equal(kpa.gaugeMin, 90);
  assert.equal(kpa.gaugeMax, 110);
});
