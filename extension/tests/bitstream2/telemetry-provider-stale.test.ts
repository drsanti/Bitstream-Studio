import assert from "node:assert/strict";
import test from "node:test";
import { ProviderStaleTracker } from "../../src/bitstream2/telemetry-provider/provider-stale-tracker";

test("ProviderStaleTracker emits stale once until a new sample", () => {
  const emitted: Array<{ sensor: string; lastHostMs: number }> = [];
  const tracker = new ProviderStaleTracker(
    100,
    (payload) => {
      emitted.push({ sensor: payload.sensor, lastHostMs: payload.lastHostMs });
    },
    25,
  );

  tracker.noteSample({ sensor: "bmi270", hostMs: 1000 });
  tracker.evaluateStaleAt(1050);
  assert.equal(emitted.length, 0);
  tracker.evaluateStaleAt(1101);
  tracker.evaluateStaleAt(1200);

  assert.equal(emitted.length, 1);
  assert.equal(emitted[0]?.sensor, "bmi270");

  tracker.noteSample({ sensor: "bmi270", hostMs: 1200 });
  tracker.evaluateStaleAt(1301);
  assert.equal(emitted.length, 2);
});

test("ProviderStaleTracker uses per-sensor stale thresholds", () => {
  const emitted: Array<{ sensor: string; staleAfterMs: number }> = [];
  const tracker = new ProviderStaleTracker(
    (sensor) => (sensor === "bmi270" ? 100 : 500),
    (payload) => {
      emitted.push({ sensor: payload.sensor, staleAfterMs: payload.staleAfterMs });
    },
    25,
  );

  tracker.noteSample({ sensor: "bmi270", hostMs: 1000 });
  tracker.noteSample({ sensor: "sht40", hostMs: 1000 });
  tracker.evaluateStaleAt(1101);
  tracker.evaluateStaleAt(1501);

  assert.deepEqual(
    emitted.map((e) => e.sensor).sort(),
    ["bmi270", "sht40"],
  );
  assert.equal(emitted.find((e) => e.sensor === "bmi270")?.staleAfterMs, 100);
  assert.equal(emitted.find((e) => e.sensor === "sht40")?.staleAfterMs, 500);
});
