import assert from "node:assert/strict";
import test from "node:test";

import {
  computeSensorDecodeStaleBeyondInterval,
  computeSensorDecodeStaleRecoverLikely,
  listStaleEnabledSensorsBeyondInterval,
} from "../../src/webview/bitstream-app/components/telemetry/sensorDecodeStaleWatchdog.js";

const nowMs = 20_000_000;
/** SHT40 source id (see sensorSourceIds.ts). */
const SHT40_SOURCE_ID = 1;

test("detects stale when age exceeds interval × multiplier", () => {
  const stale = listStaleEnabledSensorsBeyondInterval({
    lastAtByHint: { sht40: nowMs - 350, dps368: null, bmm350: null, bmi270: null },
    nowMs,
    bySourceId: {
      [SHT40_SOURCE_ID]: { enabled: true, samplingIntervalMs: 100 },
    },
    multiplier: 3,
  });
  assert.equal(stale.length, 1);
  assert.equal(stale[0]?.hint, "sht40");
  assert.equal(stale[0]?.thresholdMs, 300);
});

test("recover likely requires handshake and prior samples", () => {
  assert.equal(
    computeSensorDecodeStaleRecoverLikely({
      serialOpen: true,
      handshakeState: "passed",
      sampleCount: 1,
      lastAtByHint: { sht40: nowMs - 500, dps368: null, bmm350: null, bmi270: null },
      nowMs,
      bySourceId: {
        [SHT40_SOURCE_ID]: { enabled: true, samplingIntervalMs: 100 },
      },
      multiplier: 3,
    }),
    true,
  );
  assert.equal(
    computeSensorDecodeStaleRecoverLikely({
      serialOpen: true,
      handshakeState: "passed",
      sampleCount: 0,
      lastAtByHint: { sht40: nowMs - 500, dps368: null, bmm350: null, bmi270: null },
      nowMs,
      bySourceId: {},
      multiplier: 3,
    }),
    false,
  );
});

test("recover likely when worst Δ exceeds absolute floor even if cfg interval is large", () => {
  assert.equal(
    computeSensorDecodeStaleRecoverLikely({
      serialOpen: true,
      handshakeState: "passed",
      sampleCount: 10,
      lastAtByHint: { sht40: nowMs - 9200, dps368: null, bmm350: null, bmi270: null },
      nowMs,
      bySourceId: {
        [SHT40_SOURCE_ID]: { enabled: true, samplingIntervalMs: 10_000 },
      },
      multiplier: 2,
    }),
    true,
  );
});

test("fresh decode within multiplier is not stale", () => {
  assert.equal(
    computeSensorDecodeStaleBeyondInterval({
      lastAtByHint: { sht40: nowMs - 150, dps368: null, bmm350: null, bmi270: null },
      nowMs,
      bySourceId: {
        [SHT40_SOURCE_ID]: { enabled: true, samplingIntervalMs: 100 },
      },
      multiplier: 3,
    }),
    false,
  );
});
