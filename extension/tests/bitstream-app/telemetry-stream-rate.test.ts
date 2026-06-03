import assert from "node:assert/strict";
import test from "node:test";
import {
  computeRollingFpsFromSampleCount,
  emaStreamHz,
  emptyStreamHzByHint,
  formatAggregateDecodeFps,
  hzInstantFromGapMs,
  pushHostGapRing,
  smoothedHzFromGapRing,
  u32CounterDelta,
  updateTelemetryStreamRates,
} from "../../src/webview/bitstream-app/utils/telemetryStreamRate";

test("hzInstantFromGapMs returns 50 Hz for 20 ms gap", () => {
  assert.ok(Math.abs((hzInstantFromGapMs(20) ?? 0) - 50) < 0.001);
});

test("u32CounterDelta handles wrap", () => {
  assert.equal(u32CounterDelta(0xfffffffe, 1), 3);
  assert.equal(u32CounterDelta(10, 12), 2);
});

test("smoothedHzFromGapRing uses mean gap", () => {
  assert.ok(Math.abs((smoothedHzFromGapRing([20, 20]) ?? 0) - 50) < 0.001);
});

test("emaStreamHz blends toward new sample", () => {
  assert.equal(emaStreamHz(40, 60, 0.5), 50);
});

test("updateTelemetryStreamRates updates device and host tracks", () => {
  const empty = emptyStreamHzByHint();
  const result = updateTelemetryStreamRates({
    hint: "bmi270",
    interArrivalMs: 20,
    hostInterArrivalMs: 22,
    prevCounter: 9,
    nextCounter: 10,
    streamHzDeviceByHint: empty,
    streamHzHostByHint: empty,
    streamHzCounterByHint: empty,
    streamHzSmoothedByHint: empty,
    hostGapRing: [],
  });
  assert.ok(Math.abs((result.streamHzDeviceByHint.bmi270 ?? 0) - 50) < 1);
  assert.ok(Math.abs((result.streamHzHostByHint.bmi270 ?? 0) - 1000 / 22) < 1);
  assert.ok(Math.abs((result.streamHzCounterByHint.bmi270 ?? 0) - 1000 / 22) < 1);
  assert.equal(result.hostGapRing.length, 1);
});

test("skips counter Hz when counter unchanged", () => {
  const empty = emptyStreamHzByHint();
  const result = updateTelemetryStreamRates({
    hint: "dps368",
    interArrivalMs: 1000,
    hostInterArrivalMs: 1000,
    prevCounter: 5,
    nextCounter: 5,
    streamHzDeviceByHint: empty,
    streamHzHostByHint: empty,
    streamHzCounterByHint: empty,
    streamHzSmoothedByHint: empty,
    hostGapRing: [],
  });
  assert.equal(result.streamHzCounterByHint.dps368, null);
});

test("pushHostGapRing trims to max length", () => {
  assert.deepEqual(pushHostGapRing([1, 2, 3], 4, 3), [2, 3, 4]);
});

test("formatAggregateDecodeFps formats toolbar labels", () => {
  assert.equal(formatAggregateDecodeFps(null), "— fps");
  assert.equal(formatAggregateDecodeFps(0), "<1 fps");
  assert.equal(formatAggregateDecodeFps(0.42), "<1 fps");
  assert.equal(formatAggregateDecodeFps(0.99), "<1 fps");
  assert.equal(formatAggregateDecodeFps(1), "1.00 fps");
  assert.equal(formatAggregateDecodeFps(42.37), "42.4 fps");
  assert.equal(formatAggregateDecodeFps(128.4), "128 fps");
});

test("computeRollingFpsFromSampleCount uses sample counter delta", () => {
  const first = computeRollingFpsFromSampleCount({
    sampleCount: 10,
    nowMs: 1000,
    prevTick: { sampleCount: 0, atMs: 0 },
  });
  assert.ok(Math.abs((first.fps ?? 0) - 10) < 0.001);
  assert.deepEqual(first.nextTick, { sampleCount: 10, atMs: 1000 });

  const tooSoon = computeRollingFpsFromSampleCount({
    sampleCount: 12,
    nowMs: 1100,
    prevTick: first.nextTick,
  });
  assert.equal(tooSoon.fps, null);
});
