import assert from "node:assert/strict";
import test from "node:test";
import {
  formatFusionEulerDisplayFromRad,
  fusionEulerRadFromWireHundredths,
} from "../../src/webview/bitstream-app/telemetry/fusionEulerAngleDisplay";
import { fusionEulerRowDisplay } from "../../src/webview/bitstream-app/components/bmi270/bmi270FusionDeckDisplay";

test("fusionEulerRadFromWireHundredths wraps to signed pi", () => {
  assert.ok(Math.abs(fusionEulerRadFromWireHundredths(314) - Math.PI) < 0.02);
  assert.ok(Math.abs(fusionEulerRadFromWireHundredths(-314) + Math.PI) < 0.02);
});

test("formatFusionEulerDisplayFromRad — signed rad", () => {
  const row = formatFusionEulerDisplayFromRad(Math.PI / 2, "signed-pi-rad", 2);
  assert.equal(row.unit, "rad");
  assert.equal(row.text, "1.57");
  assert.equal(row.centerZeroGaugeMaxAbs, Math.PI);
});

test("formatFusionEulerDisplayFromRad — signed deg", () => {
  const row = formatFusionEulerDisplayFromRad(Math.PI / 2, "signed-deg", 1);
  assert.equal(row.unit, "°");
  assert.equal(row.text, "90.0");
  assert.equal(row.centerZeroGaugeMaxAbs, 180);
});

test("formatFusionEulerDisplayFromRad — unsigned deg", () => {
  const row = formatFusionEulerDisplayFromRad(-Math.PI / 2, "unsigned-deg", 1);
  assert.equal(row.unit, "°");
  assert.equal(row.text, "270.0");
  assert.equal(row.oneSidedGaugeMaxAbs, 360);
  assert.equal(row.positiveSignMode, "omit");
});

test("fusionEulerRowDisplay uses sample when present", () => {
  const row = fusionEulerRowDisplay(157, undefined, null, "signed-pi-rad", 3);
  assert.equal(row.value, "1.570");
  assert.equal(row.unit, "rad");
});

test("fusionEulerRowDisplay — deg mode from wire tap", () => {
  const row = fusionEulerRowDisplay(undefined, Math.PI / 2, 1000, "signed-deg", 1);
  assert.equal(row.value, "90.0");
  assert.equal(row.unit, "°");
});
