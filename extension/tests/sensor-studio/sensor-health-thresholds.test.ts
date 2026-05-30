import assert from "node:assert/strict";
import test from "node:test";

import {
  SENSOR_HEALTH_FALLBACK_LIVE_MAX_AGE_MS,
  SENSOR_HEALTH_FALLBACK_STALE_MAX_AGE_MS,
  sensorHealthAgeThresholdsMs,
} from "../../src/webview/sensor-studio/core/device/sensor-health-thresholds";

test("sensorHealthAgeThresholdsMs uses gentle defaults when row is missing", () => {
  const t = sensorHealthAgeThresholdsMs(null);
  assert.equal(t.liveMaxAgeMs, SENSOR_HEALTH_FALLBACK_LIVE_MAX_AGE_MS);
  assert.equal(t.staleMaxAgeMs, SENSOR_HEALTH_FALLBACK_STALE_MAX_AGE_MS);
  assert.ok(t.staleMaxAgeMs > t.liveMaxAgeMs);
});

test("sensorHealthAgeThresholdsMs scales with longer sampling intervals", () => {
  const slow = sensorHealthAgeThresholdsMs({
    publishMode: 0,
    samplingIntervalMs: 5000,
    minPublishIntervalMs: 5000,
  });
  const fast = sensorHealthAgeThresholdsMs({
    publishMode: 0,
    samplingIntervalMs: 100,
    minPublishIntervalMs: 100,
  });
  assert.ok(slow.liveMaxAgeMs >= fast.liveMaxAgeMs);
  assert.ok(slow.staleMaxAgeMs >= fast.staleMaxAgeMs);
});
