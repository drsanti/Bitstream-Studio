import assert from "node:assert/strict";
import test from "node:test";

import {
  BITSTREAM_CAPS_FLAG_LOG_LEVEL_CONTROL,
  BITSTREAM_CHANNEL_CONTROL,
  BITSTREAM_CHANNEL_DIAGNOSTICS,
  decodeBmi270ModeSetAck,
  decodeCapsAck,
  decodeDiagAck,
  decodeHelloAck,
  decodePingAck,
  decodeSensorCfgGetAck,
  decodeSensorCfgSetAck,
  decodeSensorReinitAck,
  decodeStatusAck,
  type BitstreamFrame,
} from "../../src/bitstream";

function makeFrame(channel: number, payload: number[]): BitstreamFrame {
  return {
    sequence: 1,
    channel,
    flags: 0,
    payload: Uint8Array.from(payload),
  };
}

test("decodeHelloAck parses protocol version", () => {
  const parsed = decodeHelloAck(makeFrame(BITSTREAM_CHANNEL_CONTROL, [0x81, 0x00, 0x01]));
  assert.equal(parsed.ackId, 0x81);
  assert.equal(parsed.status, 0x00);
  assert.equal(parsed.protocolVersion, 0x01);
});

test("decodePingAck parses nonce echo", () => {
  const parsed = decodePingAck(makeFrame(BITSTREAM_CHANNEL_CONTROL, [0x82, 0x00, 0x7f]));
  assert.equal(parsed.nonceEcho, 0x7f);
});

test("decodeCapsAck parses little-endian caps flags", () => {
  const parsed = decodeCapsAck(makeFrame(BITSTREAM_CHANNEL_CONTROL, [0x83, 0x00, 0x34, 0x12]));
  assert.equal(parsed.capsFlags, 0x1234);
});

test("decodeCapsAck includes log-level capability bit when advertised", () => {
  const parsed = decodeCapsAck(
    makeFrame(BITSTREAM_CHANNEL_CONTROL, [0x83, 0x00, BITSTREAM_CAPS_FLAG_LOG_LEVEL_CONTROL, 0x00]),
  );
  assert.equal((parsed.capsFlags & BITSTREAM_CAPS_FLAG_LOG_LEVEL_CONTROL) !== 0, true);
});

test("decodeCapsAck accepts legacy 3-byte firmware payload (high caps byte truncated on wire)", () => {
  const parsed = decodeCapsAck(makeFrame(BITSTREAM_CHANNEL_CONTROL, [0x83, 0x00, 0x07]));
  assert.equal(parsed.capsFlags, 0x0007);
});

test("decodeStatusAck parses counter and protocol version", () => {
  const parsed = decodeStatusAck(makeFrame(BITSTREAM_CHANNEL_CONTROL, [0x84, 0x00, 0x2a, 0x00, 0x01]));
  assert.equal(parsed.counter, 42);
  assert.equal(parsed.protocolVersion, 1);
});

test("decodeSensorCfgGetAck parses config fields", () => {
  const parsed = decodeSensorCfgGetAck(
    makeFrame(BITSTREAM_CHANNEL_CONTROL, [0x85, 0x00, 0x04, 0x01, 0x02, 0x90, 0x01, 0x0a, 0x00, 0x14, 0x00]),
  );
  assert.equal(parsed.sourceId, 4);
  assert.equal(parsed.enabled, true);
  assert.equal(parsed.publishMode, 2);
  assert.equal(parsed.samplingIntervalMs, 400);
  assert.equal(parsed.deltaX100, 10);
  assert.equal(parsed.minPublishIntervalMs, 20);
});

test("decodeSensorCfgSetAck parses applied mask", () => {
  const parsed = decodeSensorCfgSetAck(makeFrame(BITSTREAM_CHANNEL_CONTROL, [0x86, 0x00, 0x02, 0xff, 0x00]));
  assert.equal(parsed.sourceId, 2);
  assert.equal(parsed.appliedMask, 0x00ff);
});

test("decodeSensorReinitAck parses source id", () => {
  const parsed = decodeSensorReinitAck(makeFrame(BITSTREAM_CHANNEL_CONTROL, [0x87, 0x00, 0x03]));
  assert.equal(parsed.sourceId, 3);
});

test("decodeBmi270ModeSetAck parses mode echo", () => {
  const parsed = decodeBmi270ModeSetAck(makeFrame(BITSTREAM_CHANNEL_CONTROL, [0x88, 0x00, 0x02]));
  assert.equal(parsed.modeEcho, 2);
});

test("decodeDiagAck parses request and detail IDs", () => {
  const parsed = decodeDiagAck(makeFrame(BITSTREAM_CHANNEL_DIAGNOSTICS, [0x80, 0x10, 0x00, 0x34, 0x12, 0xcd, 0xab]));
  assert.equal(parsed.ackCommandId, 0x10);
  assert.equal(parsed.resultCode, 0x00);
  assert.equal(parsed.requestId, 0x1234);
  assert.equal(parsed.detail, 0xabcd);
});

test("decodeHelloAck rejects invalid ack id", () => {
  assert.throws(() => decodeHelloAck(makeFrame(BITSTREAM_CHANNEL_CONTROL, [0x82, 0x00, 0x01])), /Unexpected ACK id/i);
});
