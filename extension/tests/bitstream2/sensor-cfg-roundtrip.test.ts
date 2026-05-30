import assert from "node:assert/strict";
import test from "node:test";
import {
  decodeSensorCfgBody,
  encodeSensorCfgBody,
} from "../../src/bitstream2/domains/config/sensor-config";
import { BsFirmwareSimulator } from "../../src/bitstream2/device/firmware-simulator";
import { BS2_CMD } from "../../src/bitstream2/domains/config/commands";
import { encodeReq, decodeRes } from "../../src/bitstream2/protocol/req-res";
import { encodeBsEnvelope } from "../../src/bitstream2/framing/bs-envelope";
import { BS_TYPE } from "../../src/bitstream2/protocol/types";
import { BsFramer } from "../../src/bitstream2/framing/bs-framer";
import {
  diffSensorCfg,
  expectedFirmwareCfg,
} from "../../src/bitstream2/dev/uart-sensor-cfg-assert";

test("expectedFirmwareCfg clamps like CM55 bs_clamp_cfg", () => {
  const e = expectedFirmwareCfg({
    sensorId: 2,
    enabled: true,
    publishMode: 1,
    mask: 0x03,
    samplingIntervalMs: 5,
    publishIntervalMs: 3,
    deltaX100: 20000,
    minPublishIntervalMs: 500,
  });
  assert.equal(e.samplingIntervalMs, 10);
  assert.equal(e.publishIntervalMs, 10);
  assert.equal(e.deltaX100, 10000);
  assert.equal(e.minPublishIntervalMs, 10);
});

test("BsFirmwareSimulator SET ack matches GET (host normalize only)", () => {
  const tx: Uint8Array[] = [];
  const sim = new BsFirmwareSimulator((bytes) => tx.push(bytes));
  const framer = new BsFramer();

  const sendReq = (reqId: number, cmdId: number, body: Uint8Array) => {
    const wire = encodeBsEnvelope({
      type: BS_TYPE.REQ,
      payload: encodeReq({ reqId, cmdId, flags: 0, body }),
    }).bytes;
    sim.rxFromHost(wire);
    const last = tx.at(-1);
    assert.ok(last);
    const frames = framer.feed(last!);
    const resFrame = frames.find((f) => f.type === BS_TYPE.RES);
    assert.ok(resFrame);
    const res = decodeRes(resFrame!.payload);
    assert.ok(res);
    assert.equal(res.status, 0);
    return res.body;
  };

  const written = {
    sensorId: 2,
    enabled: true,
    publishMode: 2 as const,
    mask: 0x03,
    samplingIntervalMs: 50,
    publishIntervalMs: 200,
    deltaX100: 5,
    minPublishIntervalMs: 25,
  };
  const setBody = encodeSensorCfgBody(written);
  const ackBody = sendReq(1, BS2_CMD.SENSOR_CFG_SET, setBody);
  const getBody = sendReq(2, BS2_CMD.SENSOR_CFG_GET, Uint8Array.of(2));

  const ack = decodeSensorCfgBody(ackBody);
  const got = decodeSensorCfgBody(getBody);
  assert.ok(ack);
  assert.ok(got);
  assert.deepEqual(diffSensorCfg(ack, got), []);
});

test("diffSensorCfg reports field mismatches", () => {
  const a = expectedFirmwareCfg({
    sensorId: 1,
    enabled: true,
    publishMode: 0,
    mask: 0x03,
    samplingIntervalMs: 50,
    publishIntervalMs: 0,
    deltaX100: 0,
    minPublishIntervalMs: 0,
  });
  const b = { ...a, publishMode: 1 as const };
  const diffs = diffSensorCfg(a, b);
  assert.equal(diffs.length, 1);
  assert.equal(diffs[0]?.field, "publishMode");
});
