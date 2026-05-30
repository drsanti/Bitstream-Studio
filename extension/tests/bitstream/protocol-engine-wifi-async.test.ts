import assert from "node:assert/strict";
import test from "node:test";
import { ProtocolEngine } from "../../src/bitstream/engine/protocol-engine";

test("Wi-Fi async 0xA0 must not complete pending send() (only 0x80–0x9F)", () => {
  const engine = new ProtocolEngine({});
  const encoded = engine.createRequest({
    requestId: "r1",
    channel: 6,
    commandId: 1,
    payload: new Uint8Array([1, 2]),
  });
  assert.ok(encoded.sequence !== undefined);

  const noop = engine.handleIncomingFrame({
    sequence: encoded.sequence,
    channel: 6,
    flags: 0,
    payload: Uint8Array.of(0xa0, 0, 0, 0),
  });
  assert.equal(noop, null);

  const completed = engine.handleIncomingFrame({
    sequence: encoded.sequence,
    channel: 6,
    flags: 0,
    payload: Uint8Array.of(0x81, 0, 0, 0),
  });
  assert.ok(completed != null);
});

test("ACK on wrong channel must not complete pending (sequence collision guard)", () => {
  const engine = new ProtocolEngine({});
  const encoded = engine.createRequest({
    requestId: "r-wifi",
    channel: 6,
    commandId: 1,
    payload: new Uint8Array([1, 2]),
  });

  const wrongChannel = engine.handleIncomingFrame({
    sequence: encoded.sequence,
    channel: 5,
    flags: 0,
    payload: Uint8Array.of(0x81, 0, 0, 0),
  });
  assert.equal(wrongChannel, null);

  const ok = engine.handleIncomingFrame({
    sequence: encoded.sequence,
    channel: 6,
    flags: 0,
    payload: Uint8Array.of(0x81, 0, 0, 0),
  });
  assert.ok(ok != null);
});
