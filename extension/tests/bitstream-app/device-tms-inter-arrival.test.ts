import assert from "node:assert/strict";
import test from "node:test";
import {
  computeSampleInterArrivalMs,
  deviceTMsInterArrivalMs,
} from "../../src/webview/bitstream-app/utils/deviceTMsInterArrival";

test("deviceTMsInterArrivalMs handles normal and u32 wrap", () => {
  assert.equal(deviceTMsInterArrivalMs(1000, 1500), 500);
  assert.equal(deviceTMsInterArrivalMs(0xffff_ff00, 0x100), 0x200);
});

test("computeSampleInterArrivalMs uses device tMs delta", () => {
  const delta = computeSampleInterArrivalMs({
    sample: {
      counter: 2,
      deviceTMs: 2500,
      temperatureCx100: 0,
      secondaryX100: 0,
      sourceHint: "dps368",
      isBmi270FusionPayload: false,
    },
    prevLatest: {
      counter: 1,
      deviceTMs: 1500,
      temperatureCx100: 0,
      secondaryX100: 0,
      sourceHint: "dps368",
      isBmi270FusionPayload: false,
    },
    prevWallAtMs: 100,
    prevInterArrivalMs: 900,
    nowMs: 200,
  });
  assert.equal(delta, 1000);
});

test("computeSampleInterArrivalMs keeps prior delta for BMI270 mask subset burst", () => {
  const delta = computeSampleInterArrivalMs({
    sample: {
      counter: 5,
      deviceTMs: 3000,
      temperatureCx100: 0,
      secondaryX100: 0,
      sourceHint: "bmi270",
      isBmi270FusionPayload: false,
    },
    prevLatest: {
      counter: 5,
      deviceTMs: 3000,
      temperatureCx100: 0,
      secondaryX100: 0,
      sourceHint: "bmi270",
      isBmi270FusionPayload: false,
    },
    prevWallAtMs: 100,
    prevInterArrivalMs: 25,
    nowMs: 105,
  });
  assert.equal(delta, 25);
});

test("computeSampleInterArrivalMs falls back to host wall gap without deviceTMs", () => {
  const delta = computeSampleInterArrivalMs({
    sample: {
      counter: 2,
      temperatureCx100: 0,
      secondaryX100: 0,
      sourceHint: "sht40",
      isBmi270FusionPayload: false,
    },
    prevLatest: null,
    prevWallAtMs: 1000,
    prevInterArrivalMs: null,
    nowMs: 1500,
  });
  assert.equal(delta, 500);
});
