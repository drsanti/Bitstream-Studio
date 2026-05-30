import assert from "node:assert/strict";
import test from "node:test";
import { extractNormalizedQuatFromBmi270Sample } from "../../src/webview/bitstream-app/components/3d-rotation/shared/bmi270FusionExtract.js";
import { useBmi270FusionQuatOrientationStore } from "../../src/webview/bitstream-app/state/bmi270FusionQuatOrientation.store";

test("orientation store accepts consecutive wire quaternions", () => {
  useBmi270FusionQuatOrientationStore.getState().reset();
  const push = useBmi270FusionQuatOrientationStore.getState().pushFromWireSample;
  const base = {
    sourceHint: "bmi270" as const,
    counter: 1,
    temperatureCx100: 2500,
    secondaryX100: 0,
    isBmi270FusionPayload: true,
  };
  push({
    ...base,
    fusionQuatWBucketX10000: 19000,
    fusionQuatXX10000: 3500,
    fusionQuatYX10000: -100,
    fusionQuatZX10000: -2700,
  });
  const s1 = useBmi270FusionQuatOrientationStore.getState();
  assert.equal(s1.seq, 1);
  assert.ok(Math.abs(s1.qw - 0.9) < 0.02);

  push({
    ...base,
    counter: 2,
    fusionQuatWBucketX10000: 18500,
    fusionQuatXX10000: 4000,
    fusionQuatYX10000: 0,
    fusionQuatZX10000: -2500,
  });
  const s2 = useBmi270FusionQuatOrientationStore.getState();
  assert.equal(s2.seq, 2);
  assert.notEqual(s2.qx, s1.qx);
});

test("orientation store passes through large wire step unchanged", () => {
  useBmi270FusionQuatOrientationStore.getState().reset();
  const push = useBmi270FusionQuatOrientationStore.getState().pushFromWireSample;
  const base = {
    sourceHint: "bmi270" as const,
    counter: 1,
    temperatureCx100: 2500,
    secondaryX100: 0,
    isBmi270FusionPayload: true,
  };
  push({
    ...base,
    fusionQuatWBucketX10000: 20000,
    fusionQuatXX10000: 0,
    fusionQuatYX10000: 0,
    fusionQuatZX10000: 0,
  });
  const second = {
    ...base,
    counter: 2,
    fusionQuatWBucketX10000: 18500,
    fusionQuatXX10000: 4000,
    fusionQuatYX10000: 0,
    fusionQuatZX10000: -2500,
  };
  push(second);
  const s2 = useBmi270FusionQuatOrientationStore.getState();
  const decoded = extractNormalizedQuatFromBmi270Sample(second);
  assert.ok(Math.abs(s2.qw - decoded.qw) < 1e-6);
  assert.ok(Math.abs(s2.qx - decoded.qx) < 1e-6);
});
