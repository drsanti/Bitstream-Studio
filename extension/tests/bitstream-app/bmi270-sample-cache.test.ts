import assert from "node:assert/strict";
import test from "node:test";
import {
  finalizeBmi270DeckSample,
  mergeBmi270SampleCache,
} from "../../src/webview/bitstream-app/bmi270/bmi270SampleCache";
import type { Bmi270LiveSample } from "../../src/webview/bitstream-app/types/bitstreamWorkspaceTypes";

function gyroOnly(counter: number): Bmi270LiveSample {
  return {
    counter,
    sourceHint: "bmi270",
    isBmi270FusionPayload: false,
    gyroXRadSX100: 10,
    gyroYRadSX100: 0,
    gyroZRadSX100: 0,
  };
}

function accTemp(counter: number, tempCx100: number): Bmi270LiveSample {
  return {
    counter,
    sourceHint: "bmi270",
    isBmi270FusionPayload: false,
    accelXMs2X100: 981,
    accelYMs2X100: 0,
    accelZMs2X100: 0,
    temperatureCx100: tempCx100,
    secondaryX100: 981,
  };
}

test("finalizeBmi270DeckSample restores temperature from session aggregate", () => {
  const session = accTemp(2, 2350);
  const cached = gyroOnly(3);
  const out = finalizeBmi270DeckSample(cached, session);
  assert.ok(out);
  assert.equal(out.temperatureCx100, 2350);
  assert.equal(out.gyroXRadSX100, 10);
});

test("mergeBmi270SampleCache keeps temperature across gyro-only frames when session still has temp", () => {
  const t0 = 1_000_000;
  let cache = mergeBmi270SampleCache(null, accTemp(1, 2400), t0);
  assert.ok(cache);
  assert.equal(cache.sample.temperatureCx100, 2400);

  const session = accTemp(1, 2400);
  for (let i = 0; i < 20; i += 1) {
    cache = mergeBmi270SampleCache(cache, gyroOnly(2 + i), t0 + i * 500);
  }

  const deck = finalizeBmi270DeckSample(cache?.sample, session);
  assert.equal(deck?.temperatureCx100, 2400);
});
