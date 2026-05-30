import assert from "node:assert/strict";
import test from "node:test";
import { BMI270_MASK } from "../../src/bitstream2/domains/sensors/bmi270";
import {
  bmi270MaskForFusionOutput,
  bmi270MaskIncludesFusionChannels,
} from "../../src/webview/bitstream-app/lib/bmi270MaskForOutputMode";

test("bmi270MaskForFusionOutput — motion preset gains Euler+Quat for hybrid", () => {
  const motion = BMI270_MASK.ACC | BMI270_MASK.GYR;
  assert.equal(motion, 0x03);
  const next = bmi270MaskForFusionOutput("hybrid", motion);
  assert.equal(next & BMI270_MASK.EULER, BMI270_MASK.EULER);
  assert.equal(next & BMI270_MASK.QUAT, BMI270_MASK.QUAT);
  assert.equal(bmi270MaskIncludesFusionChannels(next), true);
});

test("bmi270MaskForFusionOutput — raw leaves mask unchanged", () => {
  const motion = 0x03;
  assert.equal(bmi270MaskForFusionOutput("raw", motion), motion);
});
