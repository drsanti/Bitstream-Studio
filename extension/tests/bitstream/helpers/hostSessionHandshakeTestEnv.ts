import {
  BitstreamFrameEncoder,
  HostSession,
  ProtocolEngine,
  createLinkedInMemoryTransports,
} from "../../../src/bitstream";

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

/**
 * Real {@link HostSession} over linked transports so {@link handshake.run} succeeds (same wiring as
 * `handshake-workflow.test.ts`).
 */
export async function withHostSessionForHandshakeTest<T>(fn: (session: HostSession) => Promise<T>): Promise<T> {
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
    return await fn(session);
  } finally {
    unbindFirmware();
    await session.close();
    await firmwareTransport.close();
  }
}
