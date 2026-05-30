import assert from "node:assert/strict";
import test from "node:test";
import { BsFramer } from "../../src/bitstream2/framing/bs-framer";
import { encodeBsEnvelope } from "../../src/bitstream2/framing/bs-envelope";
import { encodeHello } from "../../src/bitstream2/protocol/hello";
import { BS_TYPE } from "../../src/bitstream2/protocol/types";
import { crc16CcittFalse } from "../../src/bitstream2/framing/crc16";

test("BsFramer decodes a valid HELLO frame", () => {
  const payload = encodeHello({ version: 1, caps: 1, mtuSensor: 256, mtuCtrl: 512, fwTag: "t" });
  const wire = encodeBsEnvelope({ type: BS_TYPE.HELLO, payload }).bytes;
  const framer = new BsFramer();
  const frames = framer.feed(wire);
  assert.equal(frames.length, 1);
  assert.equal(frames[0]?.type, BS_TYPE.HELLO);
  assert.equal(framer.getStats().framesOk, 1);
});

test("BsFramer resyncs after garbage prefix bytes", () => {
  const payload = encodeHello({ version: 1, caps: 0, mtuSensor: 0, mtuCtrl: 0 });
  const good = encodeBsEnvelope({ type: BS_TYPE.HELLO, payload }).bytes;
  const noise = Uint8Array.from([0x00, 0xff, 0x42, 0x51]);
  const framer = new BsFramer();
  const frames = framer.feed(concat(noise, good));
  assert.equal(frames.length, 1);
  assert.ok(framer.getStats().resyncByteSkips > 0);
});

test("BsFramer rejects CRC mismatch and continues scanning", () => {
  const payload = encodeHello({ version: 1, caps: 0, mtuSensor: 0, mtuCtrl: 0 });
  const wire = new Uint8Array(encodeBsEnvelope({ type: BS_TYPE.HELLO, payload }).bytes);
  wire[wire.length - 4] ^= 0xff;
  const framer = new BsFramer();
  const bad = framer.feed(wire);
  assert.equal(bad.length, 0);
  assert.equal(framer.getStats().framesCrcFail, 1);

  const good = encodeBsEnvelope({ type: BS_TYPE.HELLO, payload }).bytes;
  const ok = framer.feed(good);
  assert.equal(ok.length, 1);
});

test("BsFramer rejects LEN above cap for TYPE", () => {
  const framer = new BsFramer();
  const huge = new Uint8Array(3 + 2 + 1 + 600 + 2 + 2);
  huge[0] = 0x42;
  huge[1] = 0x53;
  huge[2] = 0x20;
  huge[3] = 0xff;
  huge[4] = 0x01;
  huge[5] = BS_TYPE.EVT_SENSOR;
  const frames = framer.feed(huge);
  assert.equal(frames.length, 0);
  assert.ok(framer.getStats().framesLenReject > 0);
});

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.byteLength + b.byteLength);
  out.set(a, 0);
  out.set(b, a.byteLength);
  return out;
}

test("crc16CcittFalse matches envelope encoder", () => {
  const payload = Uint8Array.of(1, 2, 3);
  const wire = encodeBsEnvelope({ type: BS_TYPE.REQ, payload }).bytes;
  const crc = crc16CcittFalse(wire, 3, 2 + 1 + payload.byteLength);
  const crcWire = (wire[wire.length - 4] ?? 0) | ((wire[wire.length - 3] ?? 0) << 8);
  assert.equal(crc, crcWire);
});
