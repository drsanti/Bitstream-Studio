import assert from "node:assert/strict";
import test from "node:test";
import {
  CFG_ACCESS_HIGH_LOAD_SAMPLE_MS,
  cfgAccessSetTimeoutMs,
  CFG_ACCESS_SET_TIMEOUT_MS,
  CFG_ACCESS_SET_TIMEOUT_UNDER_LOAD_MS,
  isHighTelemetryLoadForCfgAccess,
  summarizeCfgAccessLoad,
} from "../../src/bitstream2/domains/config/sensor-cfg-access-policy";

test("isHighTelemetryLoadForCfgAccess detects fast sampling", () => {
  const high = isHighTelemetryLoadForCfgAccess([
    { enabled: true, samplingIntervalMs: CFG_ACCESS_HIGH_LOAD_SAMPLE_MS, publishIntervalMs: 0 },
  ]);
  assert.equal(high, true);

  const low = isHighTelemetryLoadForCfgAccess([
    { enabled: true, samplingIntervalMs: 500, publishIntervalMs: 0 },
  ]);
  assert.equal(low, false);
});

test("cfgAccessSetTimeoutMs extends under load", () => {
  const idle = cfgAccessSetTimeoutMs([
    { enabled: true, samplingIntervalMs: 500, publishIntervalMs: 0 },
  ]);
  assert.equal(idle, CFG_ACCESS_SET_TIMEOUT_MS);

  const busy = cfgAccessSetTimeoutMs([
    { enabled: true, samplingIntervalMs: 20, publishIntervalMs: 0 },
    { enabled: true, samplingIntervalMs: 20, publishIntervalMs: 0 },
    { enabled: true, samplingIntervalMs: 20, publishIntervalMs: 0 },
  ]);
  assert.equal(busy, CFG_ACCESS_SET_TIMEOUT_UNDER_LOAD_MS);
});

test("summarizeCfgAccessLoad aggregates telemetry Hz", () => {
  const s = summarizeCfgAccessLoad([
    { enabled: true, samplingIntervalMs: 20, publishIntervalMs: 0 },
    { enabled: true, samplingIntervalMs: 20, publishIntervalMs: 0 },
  ]);
  assert.equal(s.enabledCount, 2);
  assert.ok(s.aggregateTelemetryHz >= 90);
});
