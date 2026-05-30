import assert from "node:assert/strict";
import test from "node:test";
import {
  magnetometerMagnitudeUt,
  resolveMagnetometerGaugeLimits,
} from "../../src/webview/bitstream-app/telemetry/magnetometerDisplay";

test("magnetometerMagnitudeUt", () => {
  const m = magnetometerMagnitudeUt(3, 4, 0);
  assert.ok(m != null && Math.abs(m - 5) < 1e-9);
});

test("resolveMagnetometerGaugeLimits earth and wide", () => {
  const earth = resolveMagnetometerGaugeLimits("earth", 30, -20, 10, 40);
  assert.equal(earth.axisMin, -100);
  assert.equal(earth.axisMax, 100);
  assert.equal(earth.magnitudeMax, 100);

  const wide = resolveMagnetometerGaugeLimits("wide", 30, -20, 10, 40);
  assert.equal(wide.axisMax, 1000);
  assert.equal(wide.magnitudeMax, 1000);
});

test("resolveMagnetometerGaugeLimits auto scales with headroom", () => {
  const auto = resolveMagnetometerGaugeLimits("auto", 150, 10, 10, 155);
  assert.equal(auto.axisMax, 173);
  assert.equal(auto.magnitudeMax, 179);
});
