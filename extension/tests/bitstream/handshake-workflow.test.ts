import assert from "node:assert/strict";
import test from "node:test";

import {
  BITSTREAM_CAPS_FLAG_LOG_LEVEL_CONTROL,
  BitstreamFrameEncoder,
  HostSession,
  ProtocolEngine,
  createLinkedInMemoryTransports,
  runHandshakeSequence,
} from "../../src/bitstream";

function makeAckForCommand(commandId: number): Uint8Array {
  switch (commandId) {
    case 0x01:
      return new Uint8Array([0x81, 0x00, 0x01]);
    case 0x02:
      return new Uint8Array([0x82, 0x00, 0x7f]);
    case 0x03:
      return new Uint8Array([0x83, 0x00, 0x34, 0x12]);
    case 0x04:
      return new Uint8Array([0x84, 0x00, 0x2a, 0x00, 0x01]);
    default:
      return new Uint8Array([0x80, 0xff]);
  }
}

test("runHandshakeSequence returns typed aggregate with timing", async () => {
  const { left: hostTransport, right: firmwareTransport } = createLinkedInMemoryTransports();
  const session = new HostSession({
    transport: hostTransport,
    timeoutPolicy: { timeoutMs: 20, retryCount: 0 },
  });

  const firmwareDecode = new ProtocolEngine();
  const firmwareEncode = new BitstreamFrameEncoder();
  await firmwareTransport.open();

  const unbindFirmware = firmwareTransport.onData(async (chunk) => {
    const frames = firmwareDecode.feed(chunk);
    for (const frame of frames) {
      const commandId = frame.payload[0] ?? 0;
      const ackPayload = makeAckForCommand(commandId);
      const ackFrame = firmwareEncode.encodeWithSequence(frame.sequence, frame.channel, frame.flags, ackPayload);
      await firmwareTransport.write(ackFrame);
    }
  });

  await session.open();
  try {
    const result = await runHandshakeSequence(session, {
      requestIdPrefix: "test-hs",
      protocolVersion: 1,
      pingNonce: 0x7f,
    });

    assert.equal(result.protocolVersion, 1);
    assert.equal(result.capsFlags, 0x1234);
    assert.equal(result.statusCounter, 42);
    assert.equal(result.ping.nonceEcho, 0x7f);
    assert.equal(result.durationsMs.total >= 0, true);
  } finally {
    unbindFirmware();
    await session.close();
    await firmwareTransport.close();
  }
});

test("runHandshakeSequence preserves log-level capability in capsFlags", async () => {
  const { left: hostTransport, right: firmwareTransport } = createLinkedInMemoryTransports();
  const session = new HostSession({
    transport: hostTransport,
    timeoutPolicy: { timeoutMs: 20, retryCount: 0 },
  });

  const firmwareDecode = new ProtocolEngine();
  const firmwareEncode = new BitstreamFrameEncoder();
  await firmwareTransport.open();

  const unbindFirmware = firmwareTransport.onData(async (chunk) => {
    const frames = firmwareDecode.feed(chunk);
    for (const frame of frames) {
      const commandId = frame.payload[0] ?? 0;
      let ackPayload = makeAckForCommand(commandId);
      if (commandId === 0x03) {
        ackPayload = new Uint8Array([0x83, 0x00, BITSTREAM_CAPS_FLAG_LOG_LEVEL_CONTROL, 0x00]);
      }
      const ackFrame = firmwareEncode.encodeWithSequence(
        frame.sequence,
        frame.channel,
        frame.flags,
        ackPayload,
      );
      await firmwareTransport.write(ackFrame);
    }
  });

  await session.open();
  try {
    const result = await runHandshakeSequence(session, {
      requestIdPrefix: "test-hs-log-caps",
      protocolVersion: 1,
      pingNonce: 0x7f,
    });
    assert.equal(
      (result.capsFlags & BITSTREAM_CAPS_FLAG_LOG_LEVEL_CONTROL) !== 0,
      true,
    );
  } finally {
    unbindFirmware();
    await session.close();
    await firmwareTransport.close();
  }
});
