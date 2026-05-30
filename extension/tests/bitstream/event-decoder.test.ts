import assert from "node:assert/strict";
import test from "node:test";

import {
  BITSTREAM_CHANNEL_SENSOR,
  BITSTREAM_SENSOR_FLAG_BMI270_FUSION_PAYLOAD,
  BITSTREAM_SENSOR_FLAG_SOURCE_BMI270,
  BITSTREAM_SENSOR_FLAG_SOURCE_BMM350,
  decodeBitstreamEvent,
  type BitstreamFrame,
} from "../../src/bitstream";

function makeFrame(payload: Uint8Array, flags = 0): BitstreamFrame {
  return {
    sequence: 7,
    channel: BITSTREAM_CHANNEL_SENSOR,
    flags,
    payload,
  };
}

test("decodeBitstreamEvent decodes unknown SENSOR_SAMPLE_V2 fallback", () => {
  const payload = new Uint8Array(8);
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  view.setUint32(0, 10, true);
  view.setInt16(4, 2233, true);
  view.setUint16(6, 5012, true);

  const event = decodeBitstreamEvent(makeFrame(payload));
  assert.equal(event.name, "SENSOR_SAMPLE_V2");
  assert.equal(event.sensorSample?.sourceHint, "unknown");
  assert.equal(event.sensorSample?.counter, 10);
  assert.equal(event.sensorSample?.temperatureCx100, 2233);
  assert.equal(event.sensorSample?.secondaryX100, 5012);
});

test("decodeBitstreamEvent decodes BMM350 sensor sample", () => {
  const payload = new Uint8Array(12);
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  view.setUint32(0, 11, true);
  view.setInt16(4, 1900, true);
  view.setInt16(6, -110, true);
  view.setInt16(8, 220, true);
  view.setInt16(10, -330, true);

  const event = decodeBitstreamEvent(makeFrame(payload, BITSTREAM_SENSOR_FLAG_SOURCE_BMM350));
  assert.equal(event.name, "SENSOR_SAMPLE_V2");
  assert.equal(event.sensorSample?.sourceHint, "bmm350");
  assert.equal(event.sensorSample?.magneticXUtX100, -110);
  assert.equal(event.sensorSample?.magneticYUtX100, 220);
  assert.equal(event.sensorSample?.magneticZUtX100, -330);
  assert.equal(event.sensorSample?.secondaryX100, 330);
});

test("decodeBitstreamEvent decodes BMI270 raw payload", () => {
  const payload = new Uint8Array(20);
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  view.setUint32(0, 12, true);
  view.setInt16(4, 3000, true);
  view.setUint16(6, 42, true);
  view.setInt16(8, 100, true);
  view.setInt16(10, 200, true);
  view.setInt16(12, 300, true);
  view.setInt16(14, 400, true);
  view.setInt16(16, 500, true);
  view.setInt16(18, 600, true);

  const event = decodeBitstreamEvent(makeFrame(payload, BITSTREAM_SENSOR_FLAG_SOURCE_BMI270));
  assert.equal(event.name, "SENSOR_SAMPLE_V2");
  assert.equal(event.sensorSample?.sourceHint, "bmi270");
  assert.equal(event.sensorSample?.isBmi270FusionPayload, false);
  assert.equal(event.sensorSample?.accelXMs2X100, 100);
  assert.equal(event.sensorSample?.gyroZRadSX100, 600);
});

test("decodeBitstreamEvent decodes BMI270 fusion payload", () => {
  const payload = new Uint8Array(20);
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  view.setUint32(0, 13, true);
  view.setInt16(4, 2999, true);
  view.setUint16(6, 12345, true);
  view.setInt16(8, 111, true);
  view.setInt16(10, -222, true);
  view.setInt16(12, 333, true);
  view.setInt16(14, 444, true);
  view.setInt16(16, -555, true);
  view.setInt16(18, 666, true);

  const flags = BITSTREAM_SENSOR_FLAG_SOURCE_BMI270 | BITSTREAM_SENSOR_FLAG_BMI270_FUSION_PAYLOAD;
  const event = decodeBitstreamEvent(makeFrame(payload, flags));
  assert.equal(event.name, "SENSOR_SAMPLE_V2");
  assert.equal(event.sensorSample?.sourceHint, "bmi270");
  assert.equal(event.sensorSample?.isBmi270FusionPayload, true);
  assert.equal(event.sensorSample?.fusionQuatWBucketX10000, 12345);
  assert.equal(event.sensorSample?.fusionRollRadX100, 666);
});

test("decodeBitstreamEvent marks malformed sensor payload as UNKNOWN", () => {
  const malformed = new Uint8Array([1, 2, 3, 4, 5]);
  const event = decodeBitstreamEvent(makeFrame(malformed));

  assert.equal(event.name, "UNKNOWN");
  assert.equal(event.sensorSample, undefined);
});
