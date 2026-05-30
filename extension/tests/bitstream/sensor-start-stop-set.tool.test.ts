import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { createSensorStartStopSetTool } from "../../src/bitstream/mcp-server/tools/sensor-start-stop-set";

test("bitstream_sensor_start_stop_set preserves config fields while toggling enabled", async () => {
  let cfgGetCall = 0;
  const sendSensorCfgGet = mock.fn(async () => {
    cfgGetCall += 1;
    return {
      sourceId: 1,
      enabled: cfgGetCall >= 2 ? false : true,
      publishMode: 2,
      samplingIntervalMs: 300,
      deltaX100: 15,
      minPublishIntervalMs: 120,
    };
  });

  const sendSensorCfgSet = mock.fn(async () => ({
    sourceId: 1,
    appliedMask: 0xffff,
  }));

  const tool = createSensorStartStopSetTool({
    getSession: () =>
      ({
        sendSensorCfgGet,
        sendSensorCfgSet,
      }) as never,
  });

  const result = (await tool.handler({
    sourceId: 1,
    enabled: false,
    requestIdPrefix: "test-toggle",
  })) as Record<string, unknown>;

  assert.equal(result.ok, true);
  assert.equal(result.sensorState, "stopped");
  assert.equal(result.requestedEnabled, false);

  assert.equal(sendSensorCfgSet.mock.callCount(), 1);
  const before = result.before as Record<string, unknown>;
  const after = result.after as Record<string, unknown>;
  assert.equal(before.publishMode, 2);
  assert.equal(before.samplingIntervalMs, 300);
  assert.equal(before.deltaX100, 15);
  assert.equal(before.minPublishIntervalMs, 120);
  assert.equal(after.publishMode, 2);
  assert.equal(after.samplingIntervalMs, 300);
  assert.equal(after.deltaX100, 15);
  assert.equal(after.minPublishIntervalMs, 120);
});

test("bitstream_sensor_start_stop_set returns schema-safe error when session is missing", async () => {
  const tool = createSensorStartStopSetTool({
    getSession: () => null,
  });
  const result = (await tool.handler({
    sourceId: 1,
    enabled: true,
  })) as Record<string, unknown>;
  assert.equal(result.ok, false);
  assert.equal(result.error, "Bitstream session not available");
});
