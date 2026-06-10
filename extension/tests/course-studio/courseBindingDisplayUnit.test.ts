import assert from "node:assert/strict";
import test from "node:test";

import {
  applyBindingAltitudeDisplay,
  applyBindingDisplayTransform,
  applyBindingTemperatureDisplay,
  catalogBindingDisplayUnitKind,
  celsiusToFahrenheit,
  resolveBindingDisplayUnitForBinding,
} from "../../src/webview/course-studio/runtime/diagram/courseBindingDisplayUnit";
import { resolveBindingDisplayUnit } from "../../src/webview/course-studio/runtime/diagram/diagramBindingCatalog";

test("catalogBindingDisplayUnitKind classifies angular, temperature, and altitude paths", () => {
  assert.equal(catalogBindingDisplayUnitKind("bmi270.heading"), "angle");
  assert.equal(catalogBindingDisplayUnitKind("bmi270.gyrMag"), "rate");
  assert.equal(catalogBindingDisplayUnitKind("sht40.temp"), "temperature");
  assert.equal(catalogBindingDisplayUnitKind("dps368.altitudeM"), "altitude");
  assert.equal(catalogBindingDisplayUnitKind("bmi270.ax"), null);
});

test("applyBindingTemperatureDisplay converts Celsius to Fahrenheit", () => {
  const binding = { path: "bmi270.temp", fallback: 0, temperatureUnit: "fahrenheit" as const };
  assert.equal(applyBindingTemperatureDisplay(0, binding), 32);
  assert.equal(applyBindingTemperatureDisplay(100, binding), 212);
  assert.equal(
    applyBindingTemperatureDisplay(25, { path: "bmi270.temp", fallback: 0, temperatureUnit: "celsius" }),
    25,
  );
});

test("applyBindingAltitudeDisplay converts meters to feet", () => {
  const binding = { path: "dps368.altitudeM", fallback: 0, altitudeUnit: "ft" as const };
  assert.ok(Math.abs(applyBindingAltitudeDisplay(1, binding) - 3.280839895) < 1e-6);
  assert.equal(
    applyBindingAltitudeDisplay(10, { path: "dps368.altitudeM", fallback: 0, altitudeUnit: "m" }),
    10,
  );
});

test("resolveBindingDisplayUnit honors temperature and altitude preferences", () => {
  assert.equal(
    resolveBindingDisplayUnit({
      path: "sht40.temp",
      fallback: 0,
      temperatureUnit: "fahrenheit",
    }),
    "°F",
  );
  assert.equal(
    resolveBindingDisplayUnit({
      path: "dps368.altitudeM",
      fallback: 0,
      altitudeUnit: "ft",
    }),
    "ft",
  );
  assert.equal(
    resolveBindingDisplayUnitForBinding({
      path: "bmi270.heading",
      fallback: 0,
      angularUnit: "rad",
    }),
    "rad",
  );
});

test("applyBindingDisplayTransform composes angular and temperature transforms independently", () => {
  assert.equal(celsiusToFahrenheit(25), 77);
  const tempBinding = { path: "bmm350.temp", fallback: 0, temperatureUnit: "fahrenheit" as const };
  assert.equal(applyBindingDisplayTransform(25, tempBinding), 77);
  const headingBinding = { path: "bmi270.heading", fallback: 0, angularUnit: "rad" as const };
  assert.ok(Math.abs(applyBindingDisplayTransform(180, headingBinding) - Math.PI) < 1e-9);
});
