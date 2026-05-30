import assert from "node:assert/strict";
import test from "node:test";
import { effectivePublishIntervalMs } from "../../src/bitstream2/domains/config/sensor-config";
import {
  evaluateBehaviorExpect,
  resolveBehaviorWrittenCfg,
  type CfgBehaviorCase,
} from "../../src/bitstream2/dev/uart-sensor-cfg-behavior-assert";

test("evaluateBehaviorExpect target_hz passes when rate meets ratio", () => {
  const cfg = resolveBehaviorWrittenCfg({
    id: "x",
    description: "x",
    sensorId: 1,
    patch: { sensorId: 1, samplingIntervalMs: 100, publishIntervalMs: 0, publishMode: 0 },
    expect: { kind: "target_hz" },
  });
  const publishMs = effectivePublishIntervalMs(cfg);
  const targetHz = 1000 / publishMs;
  const samples = Array.from({ length: 25 }, (_, i) => ({
    sensorId: 1,
    mask: 0x03,
    values: [i, i + 1],
    seq: i,
  }));
  const errors = evaluateBehaviorExpect(1, cfg, samples, 3000, { kind: "target_hz" });
  assert.equal(errors.length, 0);
  assert.ok((25 * 1000) / 3000 >= targetHz * 0.75);
});

test("evaluateBehaviorExpect max_hz flags fast on_change stream", () => {
  const cfg = resolveBehaviorWrittenCfg({
    id: "x",
    description: "x",
    sensorId: 2,
    patch: {
      sensorId: 2,
      publishMode: 1,
      deltaX100: 10000,
      minPublishIntervalMs: 200,
      samplingIntervalMs: 20,
    },
    expect: { kind: "max_hz", hz: 1.0 },
  });
  const samples = Array.from({ length: 20 }, (_, i) => ({
    sensorId: 2,
    mask: 0x03,
    values: [i * 100, i * 100 + 1],
    seq: i,
  }));
  const errors = evaluateBehaviorExpect(2, cfg, samples, 4000, { kind: "max_hz", hz: 1.0 });
  assert.ok(errors.length > 0);
});
