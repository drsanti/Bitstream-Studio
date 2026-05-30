import assert from "node:assert/strict";
import test from "node:test";
import {
  convertTemperatureCToUnit,
  formatTemperatureFromC,
} from "../../src/webview/bitstream-app/telemetry/temperatureDisplay";

test("convertTemperatureCToUnit", () => {
  assert.equal(convertTemperatureCToUnit(0, "c"), 0);
  assert.equal(convertTemperatureCToUnit(0, "f"), 32);
  assert.ok(Math.abs(convertTemperatureCToUnit(0, "k") - 273.15) < 1e-9);
});

test("formatTemperatureFromC formats string and unit", () => {
  const c = formatTemperatureFromC(25.123, "c", 1);
  assert.equal(c.text, "25.1");
  assert.equal(c.unitLabel, "°C");

  const f = formatTemperatureFromC(0, "f", 0);
  assert.equal(f.text, "32");
  assert.equal(f.unitLabel, "°F");

  const missing = formatTemperatureFromC(undefined, "k", 2);
  assert.equal(missing.text, "--");
  assert.equal(missing.unitLabel, "K");
});

