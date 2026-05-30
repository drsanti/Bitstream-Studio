import assert from "node:assert/strict";
import test from "node:test";
import { BsFirmwareSimulator } from "../../src/bitstream2/device/firmware-simulator";
import { BS2_SENSOR_ID } from "../../src/bitstream2/domains/sensors/sensor-ids";
import { encodeSensorCfgBody } from "../../src/bitstream2/domains/config/sensor-config";
import { BS2_CMD } from "../../src/bitstream2/domains/config/commands";
import { encodeReq } from "../../src/bitstream2/protocol/req-res";
import { encodeBsEnvelope } from "../../src/bitstream2/framing/bs-envelope";
import { BS_TYPE } from "../../src/bitstream2/protocol/types";

test("firmware simulator: periodic stream after SENSOR_CFG_SET", async () => {
  const tx: Uint8Array[] = [];
  const sim = new BsFirmwareSimulator((b) => tx.push(b));
  sim.onBoot();
  tx.length = 0;

  const cfg = encodeSensorCfgBody({
    sensorId: BS2_SENSOR_ID.BMI270,
    enabled: true,
    publishMode: 0,
    mask: 0x01,
    samplingIntervalMs: 5,
    publishIntervalMs: 0,
    deltaX100: 0,
    minPublishIntervalMs: 0,
  });
  const reqPayload = encodeReq({
    reqId: 1,
    cmdId: BS2_CMD.SENSOR_CFG_SET,
    flags: 0,
    body: cfg,
  });
  const wire = encodeBsEnvelope({ type: BS_TYPE.REQ, payload: reqPayload }).bytes;
  sim.rxFromHost(wire);

  await new Promise((r) => setTimeout(r, 25));
  assert.ok(tx.length > 0, "expected EVT_SENSOR frames from stream");
  const snap = sim.getSnapshot();
  assert.ok(snap.streamActiveSensorIds.includes(BS2_SENSOR_ID.BMI270));
  sim.dispose();
});

test("firmware simulator: setStreamingPaused stops periodic streams", async () => {
  const tx: Uint8Array[] = [];
  const sim = new BsFirmwareSimulator((b) => tx.push(b));
  sim.onBoot();
  tx.length = 0;

  const cfg = encodeSensorCfgBody({
    sensorId: BS2_SENSOR_ID.BMI270,
    enabled: true,
    publishMode: 0,
    mask: 0x01,
    samplingIntervalMs: 5,
    publishIntervalMs: 0,
    deltaX100: 0,
    minPublishIntervalMs: 0,
  });
  const reqPayload = encodeReq({
    reqId: 2,
    cmdId: BS2_CMD.SENSOR_CFG_SET,
    flags: 0,
    body: cfg,
  });
  sim.rxFromHost(encodeBsEnvelope({ type: BS_TYPE.REQ, payload: reqPayload }).bytes);

  await new Promise((r) => setTimeout(r, 25));
  assert.ok(tx.length > 0);

  tx.length = 0;
  sim.setStreamingPaused(true);
  assert.equal(sim.getSnapshot().streamActiveSensorIds.length, 0);

  await new Promise((r) => setTimeout(r, 25));
  assert.equal(tx.length, 0, "idle mode should not emit EVT_SENSOR");

  sim.setStreamingPaused(false);
  await new Promise((r) => setTimeout(r, 25));
  assert.ok(tx.length > 0, "run mode resumes streams");

  sim.dispose();
});
