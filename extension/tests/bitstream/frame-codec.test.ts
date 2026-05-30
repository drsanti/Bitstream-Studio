import assert from "node:assert/strict";
import test from "node:test";

import { BITSTREAM_MAGIC, BitstreamFrameDecoder, BitstreamFrameEncoder } from "../../src/bitstream";
import { crc16Ccitt } from "../../src/bitstream/utils/crc16";

function asArray(bytes: Uint8Array): number[] {
  return Array.from(bytes);
}

test("frame encoder writes little-endian header and payload", () => {
  const encoder = new BitstreamFrameEncoder();
  encoder.resetSequence(0x1234);

  const payload = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
  const encoded = encoder.encode(0x03, 0x7f, payload);

  assert.equal(encoded.sequence, 0x1234);
  assert.equal(encoded.frame.length, 12);

  const view = new DataView(encoded.frame.buffer, encoded.frame.byteOffset, encoded.frame.byteLength);
  assert.equal(view.getUint16(0, true), BITSTREAM_MAGIC);
  assert.equal(view.getUint16(2, true), 0x1234);
  assert.equal(view.getUint8(4), 0x03);
  assert.equal(view.getUint8(5), 0x7f);
  assert.equal(view.getUint16(6, true), payload.length);
  assert.deepEqual(asArray(encoded.frame.slice(8)), asArray(payload));
});

test("frame decoder resyncs after garbage and supports split chunks", () => {
  const encoder = new BitstreamFrameEncoder();
  const decoder = new BitstreamFrameDecoder();

  encoder.resetSequence(7);
  const payload = new Uint8Array([0x02, 0x2a]);
  const frame = encoder.encode(0x03, 0x00, payload).frame;

  const withNoise = new Uint8Array(2 + frame.length);
  withNoise.set([0x00, 0x99], 0);
  withNoise.set(frame, 2);

  const first = decoder.feed(withNoise.slice(0, 5));
  assert.equal(first.frames.length, 0);
  assert.equal(first.bufferedBytes > 0, true);

  const second = decoder.feed(withNoise.slice(5));
  assert.equal(second.frames.length, 1);
  const decoded = second.frames[0];
  assert.equal(decoded.sequence, 7);
  assert.equal(decoded.channel, 0x03);
  assert.equal(decoded.flags, 0x00);
  assert.deepEqual(asArray(decoded.payload), asArray(payload));
});

test("frame decoder parses multiple frames from one chunk", () => {
  const encoder = new BitstreamFrameEncoder();
  const decoder = new BitstreamFrameDecoder();

  encoder.resetSequence(100);
  const a = encoder.encode(0x03, 0x01, new Uint8Array([0x01, 0x11])).frame;
  const b = encoder.encode(0x05, 0x00, new Uint8Array([0x80, 0x00])).frame;

  const merged = new Uint8Array(a.length + b.length);
  merged.set(a, 0);
  merged.set(b, a.length);

  const out = decoder.feed(merged);
  assert.equal(out.frames.length, 2);
  assert.equal(out.frames[0]?.sequence, 100);
  assert.equal(out.frames[1]?.sequence, 101);
  assert.equal(out.bufferedBytes, 0);
});

test("crc16Ccitt matches known vector (123456789 -> 0x29B1)", () => {
  const bytes = new TextEncoder().encode("123456789");
  assert.equal(crc16Ccitt(bytes), 0x29b1);
});
