import assert from "node:assert/strict";
import test from "node:test";
import {
  decodeSensorCfgBody,
  decodeSensorCfgBodyV1,
  decodeSensorCfgBodyV2,
  decodeSensorCfgBodyV21,
  effectivePublishIntervalMs,
  encodeSensorCfgBody,
  encodeStreamMaskSetBody,
  encodeStreamRateSetBody,
  normalizeSensorCfg,
  SENSOR_CFG_BODY_V21_LEN,
  SENSOR_CFG_BODY_V2_LEN,
} from "../../src/bitstream2/domains/config/sensor-config";

test("sensor config v2.1 body round-trip", () => {
  const body = encodeSensorCfgBody({
    sensorId: 0,
    enabled: true,
    publishMode: 2,
    mask: 0x1f,
    samplingIntervalMs: 20,
    publishIntervalMs: 100,
    deltaX100: 25,
    minPublishIntervalMs: 5,
  });
  assert.equal(body.byteLength, SENSOR_CFG_BODY_V21_LEN);
  const decoded = decodeSensorCfgBodyV21(body);
  assert.ok(decoded);
  assert.equal(decoded.publishIntervalMs, 100);
  assert.equal(decoded.samplingIntervalMs, 20);
});

test("normalize clamps publishIntervalMs below sampling", () => {
  const c = normalizeSensorCfg({
    sensorId: 0,
    enabled: true,
    publishMode: 0,
    mask: 1,
    samplingIntervalMs: 100,
    publishIntervalMs: 20,
    deltaX100: 0,
    minPublishIntervalMs: 0,
  });
  assert.equal(c.publishIntervalMs, 100);
});

test("effectivePublishIntervalMs", () => {
  const c = normalizeSensorCfg({
    sensorId: 0,
    enabled: true,
    publishMode: 0,
    mask: 1,
    samplingIntervalMs: 50,
    publishIntervalMs: 0,
    deltaX100: 0,
    minPublishIntervalMs: 0,
  });
  assert.equal(effectivePublishIntervalMs(c), 50);
  assert.equal(
    effectivePublishIntervalMs({ ...c, publishIntervalMs: 200 }),
    200,
  );
});

test("decodeSensorCfgBody accepts v2.1, v2, and v1", () => {
  const v1 = new Uint8Array([1, 1, 0x0f, 0x64, 0x00, 0x0a, 0x00]);
  const fromV1 = decodeSensorCfgBody(v1);
  assert.ok(fromV1);
  assert.equal(fromV1.publishMode, 0);
  assert.equal(fromV1.publishIntervalMs, 0);

  const v2 = new Uint8Array(10);
  v2[0] = 3;
  v2[1] = 1;
  v2[2] = 1;
  v2[3] = 0x03;
  new DataView(v2.buffer).setUint16(4, 50, true);
  const fromV2 = decodeSensorCfgBody(v2);
  assert.ok(fromV2);
  assert.equal(fromV2.publishIntervalMs, 0);

  const v21 = encodeSensorCfgBody({
    sensorId: 3,
    enabled: false,
    publishMode: 1,
    mask: 0x03,
    samplingIntervalMs: 50,
    publishIntervalMs: 200,
    deltaX100: 100,
    minPublishIntervalMs: 20,
  });
  const fromV21 = decodeSensorCfgBody(v21);
  assert.ok(fromV21);
  assert.equal(fromV21.publishIntervalMs, 200);
});

test("v1 and v2 decode helpers", () => {
  const v1 = decodeSensorCfgBodyV1(new Uint8Array([2, 1, 0x03, 0xc8, 0x00, 0, 0]));
  assert.ok(v1);
  assert.equal(v1.samplingIntervalMs, 200);

  const v2body = new Uint8Array(SENSOR_CFG_BODY_V2_LEN);
  v2body[2] = 0;
  const v2 = decodeSensorCfgBodyV2(v2body);
  assert.ok(v2);
});

test("invalid publishMode rejected in v2 decode", () => {
  const bad = encodeSensorCfgBody({
    sensorId: 0,
    enabled: true,
    publishMode: 0,
    mask: 1,
    samplingIntervalMs: 10,
    publishIntervalMs: 0,
    deltaX100: 0,
    minPublishIntervalMs: 0,
  });
  bad[2] = 9;
  assert.equal(decodeSensorCfgBodyV2(bad), null);
});

test("stream mask/rate bodies", () => {
  assert.deepEqual([...encodeStreamMaskSetBody(1, 0x0f)], [1, 0x0f]);
  const rate = encodeStreamRateSetBody(2, 100);
  assert.equal(rate[0], 2);
  assert.equal(rate[1]! | (rate[2]! << 8), 100);
});
