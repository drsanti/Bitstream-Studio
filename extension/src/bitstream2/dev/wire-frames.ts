import { encodeBsEnvelope } from "../framing/bs-envelope";
import { encodeHello } from "../protocol/hello";
import { BS2_SIM_BOARD_PROFILE } from "../device/board-profile";
import { encodeReq } from "../protocol/req-res";
import { encodeEvtSensor } from "../protocol/evt-sensor-encode";
import { BS_TYPE } from "../protocol/types";
import { BS2_CMD } from "../domains/config/commands";
import { BS2_SENSOR_ID } from "../domains/sensors/sensor-ids";
import { bytesToBase64 } from "../util/base64";

/** Full wire bytes for HELLO (device → host). */
export function wireBytesHello(fwTag = BS2_SIM_BOARD_PROFILE.hello.fwTag ?? "dev-inject"): Uint8Array {
  const payload = encodeHello({
    ...BS2_SIM_BOARD_PROFILE.hello,
    fwTag,
  });
  return encodeBsEnvelope({ type: BS_TYPE.HELLO, payload }).bytes;
}

/** Full wire bytes for host REQ PING (host → device; use with dev loopback mock). */
export function wireBytesPingReq(reqId = 1): Uint8Array {
  const payload = encodeReq({
    reqId,
    cmdId: BS2_CMD.PING,
    flags: 0,
    body: new Uint8Array(0),
  });
  return encodeBsEnvelope({ type: BS_TYPE.REQ, payload }).bytes;
}

/** Full wire bytes for BMI270 ACC sample (device → host). */
export function wireBytesBmi270AccSample(counter = 1, tMs = Date.now()): Uint8Array {
  const valuesBytes = new Uint8Array(6);
  const view = new DataView(valuesBytes.buffer);
  view.setInt16(0, 10, true);
  view.setInt16(2, 20, true);
  view.setInt16(4, 30, true);
  const payload = encodeEvtSensor({
    sensorId: BS2_SENSOR_ID.BMI270,
    mask: 0x01,
    counter,
    tMs: tMs >>> 0,
    valuesBytes,
  });
  return encodeBsEnvelope({ type: BS_TYPE.EVT_SENSOR, payload }).bytes;
}

function packSampleWire(
  sensorId: number,
  mask: number,
  counter: number,
  tMs: number,
  i16Values: number[],
): Uint8Array {
  const valuesBytes = new Uint8Array(i16Values.length * 2);
  const view = new DataView(valuesBytes.buffer);
  i16Values.forEach((v, i) => view.setInt16(i * 2, v, true));
  const payload = encodeEvtSensor({
    sensorId,
    mask,
    counter,
    tMs: tMs >>> 0,
    valuesBytes,
  });
  return encodeBsEnvelope({ type: BS_TYPE.EVT_SENSOR, payload }).bytes;
}

export function wireBytesBmm350Sample(counter = 1, tMs = Date.now()): Uint8Array {
  return packSampleWire(BS2_SENSOR_ID.BMM350, 0x03, counter, tMs, [100, 200, 300, 2500]);
}

export function wireBytesSht40Sample(counter = 1, tMs = Date.now()): Uint8Array {
  return packSampleWire(BS2_SENSOR_ID.SHT40, 0x03, counter, tMs, [2350, 5200]);
}

export function wireBytesDps368Sample(counter = 1, tMs = Date.now()): Uint8Array {
  return packSampleWire(BS2_SENSOR_ID.DPS368, 0x03, counter, tMs, [10130, 2400]);
}

export function wireBytesHelloB64(): string {
  return bytesToBase64(wireBytesHello());
}

export function wireBytesPingReqB64(reqId = 1): string {
  return bytesToBase64(wireBytesPingReq(reqId));
}

export function wireBytesBmi270AccSampleB64(counter = 1, tMs = Date.now()): string {
  return bytesToBase64(wireBytesBmi270AccSample(counter, tMs));
}
