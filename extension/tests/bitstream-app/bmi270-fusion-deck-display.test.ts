import assert from "node:assert/strict";
import test from "node:test";
import {
  fusionEulerRowDisplay,
  fusionQuatImagDisplay,
  fusionQuatWDisplay,
} from "../../src/webview/bitstream-app/components/bmi270/bmi270FusionDeckDisplay";

test("fusion quat displays -- without sample or wire tap", () => {
  assert.equal(fusionQuatImagDisplay(undefined, 0, null), "--");
  assert.equal(fusionQuatWDisplay(undefined, 1, null), "--");
});

test("fusion quat uses wire tap only after first fusion frame", () => {
  assert.equal(fusionQuatImagDisplay(undefined, 0.12, 1000), "0.12");
  assert.equal(fusionQuatWDisplay(undefined, 0.98, 1000), "0.98");
});

test("fusion quat prefers wire tap over throttled sample fields", () => {
  assert.equal(fusionQuatImagDisplay(3500, 0.35, 1000), "0.35");
  assert.equal(fusionQuatWDisplay(19000, 0.9, 1000), "0.90");
});

test("fusion euler uses sample when present", () => {
  assert.equal(fusionEulerRowDisplay(157, undefined, null, "signed-pi-rad", 3).value, "1.570");
});
