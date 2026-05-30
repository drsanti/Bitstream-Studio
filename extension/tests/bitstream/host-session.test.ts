import assert from "node:assert/strict";
import test from "node:test";

import {
  BitstreamAckStatusError,
  BITSTREAM_CHANNEL_SENSOR,
  BITSTREAM_SENSOR_FLAG_SOURCE_BMI270,
  BitstreamFrameEncoder,
  decodeHelloAck,
  HostSession,
  HELLO_REQ,
  ProtocolEngine,
  createLinkedInMemoryTransports,
} from "../../src/bitstream";

function makeRequestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function setupFirmwareResponder(options?: { ackOnAttempt?: number; disableAck?: boolean }) {
  const { left: hostTransport, right: firmwareTransport } = createLinkedInMemoryTransports();
  const session = new HostSession({
    transport: hostTransport,
    timeoutPolicy: {
      timeoutMs: 20,
      retryCount: 2,
    },
  });

  const firmwareDecode = new ProtocolEngine();
  const firmwareEncode = new BitstreamFrameEncoder();
  let attempts = 0;

  await firmwareTransport.open();

  const unbindFirmware = firmwareTransport.onData(async (chunk) => {
    const frames = firmwareDecode.feed(chunk);
    for (const frame of frames) {
      attempts += 1;

      if (options?.disableAck) {
        continue;
      }

      const targetAttempt = options?.ackOnAttempt ?? 1;
      if (attempts < targetAttempt) {
        continue;
      }

      const cmd = frame.payload[0] ?? 0;
      const ack = new Uint8Array([cmd | 0x80, 0x00]);
      const ackFrame = firmwareEncode.encodeWithSequence(frame.sequence, frame.channel, frame.flags, ack);
      await firmwareTransport.write(ackFrame);
    }
  });

  await session.open();

  return {
    session,
    firmwareTransport,
    unbindFirmware,
    getAttempts: () => attempts,
  };
}

test("HostSession resolves request when matching ACK arrives", async () => {
  const env = await setupFirmwareResponder({ ackOnAttempt: 1 });
  try {
    const ack = await env.session.send({
      requestId: makeRequestId("hello"),
      channel: 0x03,
      commandId: 0x01,
      payload: new Uint8Array([0x01]),
    });

    assert.equal(ack.channel, 0x03);
    assert.equal(ack.payload[0], 0x81);
    assert.equal(ack.payload[1], 0x00);
    assert.equal(env.getAttempts(), 1);
  } finally {
    env.unbindFirmware();
    await env.session.close();
    await env.firmwareTransport.close();
  }
});

test("HostSession sendCommand builds payload and resolves ACK", async () => {
  const env = await setupFirmwareResponder({ ackOnAttempt: 1 });
  try {
    const ack = await env.session.sendCommand({
      requestId: makeRequestId("hello-cmd"),
      command: HELLO_REQ,
      payload: new Uint8Array([0x01]),
    });

    assert.equal(ack.channel, 0x03);
    assert.equal(ack.payload[0], 0x81);
    assert.equal(ack.payload[1], 0x00);
  } finally {
    env.unbindFirmware();
    await env.session.close();
    await env.firmwareTransport.close();
  }
});

test("HostSession sendCommandAndDecode returns typed ACK", async () => {
  const { left: hostTransport, right: firmwareTransport } = createLinkedInMemoryTransports();
  const session = new HostSession({
    transport: hostTransport,
    timeoutPolicy: {
      timeoutMs: 20,
      retryCount: 0,
    },
  });

  const firmwareDecode = new ProtocolEngine();
  const firmwareEncode = new BitstreamFrameEncoder();
  await firmwareTransport.open();

  const unbindFirmware = firmwareTransport.onData(async (chunk) => {
    const frames = firmwareDecode.feed(chunk);
    for (const frame of frames) {
      const cmd = frame.payload[0] ?? 0;
      if (cmd === 0x01) {
        const ackFrame = firmwareEncode.encodeWithSequence(
          frame.sequence,
          frame.channel,
          frame.flags,
          new Uint8Array([0x81, 0x00, 0x01]),
        );
        await firmwareTransport.write(ackFrame);
      }
    }
  });

  await session.open();
  try {
    const ack = await session.sendCommandAndDecode({
      requestId: makeRequestId("hello-decoded"),
      command: HELLO_REQ,
      payload: new Uint8Array([0x01]),
      decode: decodeHelloAck,
    });

    assert.equal(ack.ackId, 0x81);
    assert.equal(ack.status, 0x00);
    assert.equal(ack.protocolVersion, 0x01);
  } finally {
    unbindFirmware();
    await session.close();
    await firmwareTransport.close();
  }
});

test("HostSession sendHello returns typed HELLO_ACK", async () => {
  const { left: hostTransport, right: firmwareTransport } = createLinkedInMemoryTransports();
  const session = new HostSession({
    transport: hostTransport,
    timeoutPolicy: {
      timeoutMs: 20,
      retryCount: 0,
    },
  });

  const firmwareDecode = new ProtocolEngine();
  const firmwareEncode = new BitstreamFrameEncoder();
  await firmwareTransport.open();

  const unbindFirmware = firmwareTransport.onData(async (chunk) => {
    const frames = firmwareDecode.feed(chunk);
    for (const frame of frames) {
      const cmd = frame.payload[0] ?? 0;
      if (cmd === 0x01) {
        const ackFrame = firmwareEncode.encodeWithSequence(
          frame.sequence,
          frame.channel,
          frame.flags,
          new Uint8Array([0x81, 0x00, 0x01]),
        );
        await firmwareTransport.write(ackFrame);
      }
    }
  });

  await session.open();
  try {
    const ack = await session.sendHello(makeRequestId("hello-wrapper"), 1);
    assert.equal(ack.ackId, 0x81);
    assert.equal(ack.status, 0x00);
    assert.equal(ack.protocolVersion, 0x01);
  } finally {
    unbindFirmware();
    await session.close();
    await firmwareTransport.close();
  }
});

test("HostSession sendSensorCfgGet returns typed config ACK", async () => {
  const { left: hostTransport, right: firmwareTransport } = createLinkedInMemoryTransports();
  const session = new HostSession({
    transport: hostTransport,
    timeoutPolicy: {
      timeoutMs: 20,
      retryCount: 0,
    },
  });

  const firmwareDecode = new ProtocolEngine();
  const firmwareEncode = new BitstreamFrameEncoder();
  await firmwareTransport.open();

  const unbindFirmware = firmwareTransport.onData(async (chunk) => {
    const frames = firmwareDecode.feed(chunk);
    for (const frame of frames) {
      const cmd = frame.payload[0] ?? 0;
      if (cmd === 0x05) {
        const ackPayload = new Uint8Array([0x85, 0x00, 0x04, 0x01, 0x02, 0x90, 0x01, 0x0a, 0x00, 0x14, 0x00]);
        const ackFrame = firmwareEncode.encodeWithSequence(frame.sequence, frame.channel, frame.flags, ackPayload);
        await firmwareTransport.write(ackFrame);
      }
    }
  });

  await session.open();
  try {
    const ack = await session.sendSensorCfgGet(makeRequestId("cfg-get-wrapper"), 4);
    assert.equal(ack.ackId, 0x85);
    assert.equal(ack.sourceId, 4);
    assert.equal(ack.enabled, true);
    assert.equal(ack.publishMode, 2);
    assert.equal(ack.samplingIntervalMs, 400);
    assert.equal(ack.deltaX100, 10);
    assert.equal(ack.minPublishIntervalMs, 20);
  } finally {
    unbindFirmware();
    await session.close();
    await firmwareTransport.close();
  }
});

test("HostSession sendDiagStreamStart builds payload and decodes DIAG_ACK", async () => {
  const { left: hostTransport, right: firmwareTransport } = createLinkedInMemoryTransports();
  const session = new HostSession({
    transport: hostTransport,
    timeoutPolicy: {
      timeoutMs: 20,
      retryCount: 0,
    },
  });

  const firmwareDecode = new ProtocolEngine();
  const firmwareEncode = new BitstreamFrameEncoder();
  await firmwareTransport.open();

  const unbindFirmware = firmwareTransport.onData(async (chunk) => {
    const frames = firmwareDecode.feed(chunk);
    for (const frame of frames) {
      const p = frame.payload;
      if (p[0] !== 0x02) {
        continue;
      }

      const view = new DataView(p.buffer, p.byteOffset, p.byteLength);
      assert.equal(p.length, 7);
      assert.equal(p[1], 1);
      assert.equal(p[2], 0);
      assert.equal(view.getUint16(3, true), 1000);
      assert.equal(view.getUint16(5, true), 500);

      const ackPayload = new Uint8Array([0x80, 0x02, 0x00, 0x00, 0x00, 0x34, 0x12]);
      const ackFrame = firmwareEncode.encodeWithSequence(frame.sequence, frame.channel, frame.flags, ackPayload);
      await firmwareTransport.write(ackFrame);
    }
  });

  await session.open();
  try {
    const ack = await session.sendDiagStreamStart(makeRequestId("diag-stream-start"), {
      diagMajor: 1,
      diagMinor: 0,
      globalPeriodMs: 1000,
      taskPeriodMs: 500,
    });

    assert.equal(ack.ackCommandId, 0x02);
    assert.equal(ack.resultCode, 0x00);
    assert.equal(ack.detail, 0x1234);
  } finally {
    unbindFirmware();
    await session.close();
    await firmwareTransport.close();
  }
});

test("HostSession sendDiagTaskStreamConfigSet builds payload and decodes DIAG_ACK", async () => {
  const { left: hostTransport, right: firmwareTransport } = createLinkedInMemoryTransports();
  const session = new HostSession({
    transport: hostTransport,
    timeoutPolicy: {
      timeoutMs: 20,
      retryCount: 0,
    },
  });

  const firmwareDecode = new ProtocolEngine();
  const firmwareEncode = new BitstreamFrameEncoder();
  await firmwareTransport.open();

  const unbindFirmware = firmwareTransport.onData(async (chunk) => {
    const frames = firmwareDecode.feed(chunk);
    for (const frame of frames) {
      const p = frame.payload;
      // cmdId=0x20, major=2, minor=0, taskPeriod=20, maxRows=6, prioMode=0, resync=2000
      assert.equal(p[0], 0x20);
      assert.equal(p[1], 0x02);
      assert.equal(p[2], 0x00);
      const view = new DataView(p.buffer, p.byteOffset, p.byteLength);
      assert.equal(view.getUint16(3, true), 20);
      assert.equal(p[5], 6);
      assert.equal(p[6], 0);
      assert.equal(view.getUint16(7, true), 2000);

      const ackPayload = new Uint8Array([0x80, 0x20, 0x00, 0x00, 0x00, 0x14, 0x00]);
      const ackFrame = firmwareEncode.encodeWithSequence(frame.sequence, frame.channel, frame.flags, ackPayload);
      await firmwareTransport.write(ackFrame);
    }
  });

  await session.open();
  try {
    const ack = await session.sendDiagTaskStreamConfigSet(makeRequestId("diag-task-stream-cfg"), {
      diagMajor: 2,
      diagMinor: 0,
      taskPeriodMs: 20,
      maxRowsPerBatch: 6,
      priorityMode: "sensor",
      resyncPeriodMs: 2000,
    });
    assert.equal(ack.ackId, 0x80);
    assert.equal(ack.ackCommandId, 0x20);
    assert.equal(ack.resultCode, 0);
  } finally {
    unbindFirmware();
    await session.close();
    await firmwareTransport.close();
  }
});

test("HostSession sendDiagSetTaskPriority builds payload and decodes DIAG_ACK", async () => {
  const { left: hostTransport, right: firmwareTransport } = createLinkedInMemoryTransports();
  const session = new HostSession({
    transport: hostTransport,
    timeoutPolicy: {
      timeoutMs: 20,
      retryCount: 0,
    },
  });

  const firmwareDecode = new ProtocolEngine();
  const firmwareEncode = new BitstreamFrameEncoder();
  await firmwareTransport.open();

  const unbindFirmware = firmwareTransport.onData(async (chunk) => {
    const frames = firmwareDecode.feed(chunk);
    for (const frame of frames) {
      const p = frame.payload;
      if (p[0] !== 0x10) {
        continue;
      }

      const view = new DataView(p.buffer, p.byteOffset, p.byteLength);
      assert.equal(p.length, 8);
      assert.equal(p[1], 1);
      assert.equal(p[2], 0);
      assert.equal(view.getUint16(3, true), 0x002a);
      assert.equal(p[5], 5);
      assert.equal(view.getUint16(6, true), 0x3344);

      const ackPayload = new Uint8Array([0x80, 0x10, 0x00, 0x44, 0x33, 0x00, 0x00]);
      const ackFrame = firmwareEncode.encodeWithSequence(frame.sequence, frame.channel, frame.flags, ackPayload);
      await firmwareTransport.write(ackFrame);
    }
  });

  await session.open();
  try {
    const ack = await session.sendDiagSetTaskPriority(makeRequestId("diag-set-priority"), {
      diagMajor: 1,
      diagMinor: 0,
      taskId: 0x002a,
      newPriority: 5,
      requestId: 0x3344,
    });

    assert.equal(ack.ackCommandId, 0x10);
    assert.equal(ack.resultCode, 0x00);
    assert.equal(ack.requestId, 0x3344);
  } finally {
    unbindFirmware();
    await session.close();
    await firmwareTransport.close();
  }
});

test("HostSession retries timed-out request and then resolves", async () => {
  const env = await setupFirmwareResponder({ ackOnAttempt: 2 });
  try {
    const ack = await env.session.send({
      requestId: makeRequestId("ping"),
      channel: 0x03,
      commandId: 0x02,
      payload: new Uint8Array([0x55]),
    });

    assert.equal(ack.payload[0], 0x82);
    assert.equal(env.getAttempts() >= 2, true);
  } finally {
    env.unbindFirmware();
    await env.session.close();
    await env.firmwareTransport.close();
  }
});

test("HostSession rejects after timeout and retry budget exhausted", async () => {
  const { left: hostTransport, right: firmwareTransport } = createLinkedInMemoryTransports();
  const session = new HostSession({
    transport: hostTransport,
    timeoutPolicy: {
      timeoutMs: 20,
      retryCount: 0,
    },
  });

  await firmwareTransport.open();
  await session.open();

  try {
    await assert.rejects(
      () =>
        session.send({
          requestId: makeRequestId("timeout"),
          channel: 0x03,
          commandId: 0x02,
          payload: new Uint8Array([0x77]),
        }),
      /timed out/i,
    );
  } finally {
    await session.close();
    await firmwareTransport.close();
  }
});

test("HostSession onSensorSample emits decoded BMI270 sample", async () => {
  const { left: hostTransport, right: firmwareTransport } = createLinkedInMemoryTransports();
  const session = new HostSession({
    transport: hostTransport,
    timeoutPolicy: {
      timeoutMs: 20,
      retryCount: 0,
    },
  });

  await firmwareTransport.open();
  await session.open();

  const firmwareEncode = new BitstreamFrameEncoder();
  firmwareEncode.resetSequence(42);

  const sensorPayload = new Uint8Array(20);
  const view = new DataView(sensorPayload.buffer, sensorPayload.byteOffset, sensorPayload.byteLength);
  view.setUint32(0, 123, true);
  view.setInt16(4, 2550, true);
  view.setUint16(6, 99, true);
  view.setInt16(8, -101, true);
  view.setInt16(10, 202, true);
  view.setInt16(12, -303, true);
  view.setInt16(14, 404, true);
  view.setInt16(16, -505, true);
  view.setInt16(18, 606, true);

  try {
    const samplePromise = new Promise<{ counter: number; accelXMs2X100?: number; gyroZRadSX100?: number }>(
      (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timed out waiting for SENSOR_SAMPLE_V2"));
        }, 300);

        const unbind = session.onSensorSample((sample) => {
          clearTimeout(timeout);
          unbind();
          resolve(sample);
        });
      },
    );

    const frame = firmwareEncode.encode(BITSTREAM_CHANNEL_SENSOR, BITSTREAM_SENSOR_FLAG_SOURCE_BMI270, sensorPayload);
    await firmwareTransport.write(frame.frame);

    const sample = await samplePromise;
    assert.equal(sample.counter, 123);
    assert.equal(sample.accelXMs2X100, -101);
    assert.equal(sample.gyroZRadSX100, 606);
  } finally {
    await session.close();
    await firmwareTransport.close();
  }
});

test("HostSession sendHello throws BitstreamAckStatusError on non-zero status", async () => {
  const { left: hostTransport, right: firmwareTransport } = createLinkedInMemoryTransports();
  const session = new HostSession({
    transport: hostTransport,
    timeoutPolicy: {
      timeoutMs: 20,
      retryCount: 0,
    },
  });

  const firmwareDecode = new ProtocolEngine();
  const firmwareEncode = new BitstreamFrameEncoder();
  await firmwareTransport.open();

  const unbindFirmware = firmwareTransport.onData(async (chunk) => {
    const frames = firmwareDecode.feed(chunk);
    for (const frame of frames) {
      const cmd = frame.payload[0] ?? 0;
      if (cmd !== 0x01) {
        continue;
      }
      const ackPayload = new Uint8Array([0x81, 0x02, 0x01]);
      const ackFrame = firmwareEncode.encodeWithSequence(frame.sequence, frame.channel, frame.flags, ackPayload);
      await firmwareTransport.write(ackFrame);
    }
  });

  await session.open();
  try {
    await assert.rejects(
      () => session.sendHello(makeRequestId("hello-status-error"), 1),
      (error: unknown) => {
        assert.ok(error instanceof BitstreamAckStatusError);
        assert.equal(error.kind, "control");
        assert.equal(error.code, 0x02);
        return true;
      },
    );
  } finally {
    unbindFirmware();
    await session.close();
    await firmwareTransport.close();
  }
});

test("HostSession sendLogLevelSet then sendLogLevelGet readback same level", async () => {
  const { left: hostTransport, right: firmwareTransport } = createLinkedInMemoryTransports();
  const session = new HostSession({
    transport: hostTransport,
    timeoutPolicy: {
      timeoutMs: 20,
      retryCount: 0,
    },
  });

  const firmwareDecode = new ProtocolEngine();
  const firmwareEncode = new BitstreamFrameEncoder();
  let currentLogLevel = 2;
  await firmwareTransport.open();

  const unbindFirmware = firmwareTransport.onData(async (chunk) => {
    const frames = firmwareDecode.feed(chunk);
    for (const frame of frames) {
      const cmd = frame.payload[0] ?? 0;
      if (cmd === 0x0d) {
        currentLogLevel = frame.payload[1] ?? currentLogLevel;
        const ackPayload = new Uint8Array([0x8b, 0x00, currentLogLevel]);
        const ackFrame = firmwareEncode.encodeWithSequence(
          frame.sequence,
          frame.channel,
          frame.flags,
          ackPayload,
        );
        await firmwareTransport.write(ackFrame);
      } else if (cmd === 0x0c) {
        const ackPayload = new Uint8Array([0x8b, 0x00, currentLogLevel]);
        const ackFrame = firmwareEncode.encodeWithSequence(
          frame.sequence,
          frame.channel,
          frame.flags,
          ackPayload,
        );
        await firmwareTransport.write(ackFrame);
      }
    }
  });

  await session.open();
  try {
    const setAck = await session.sendLogLevelSet(makeRequestId("log-level-set"), 4);
    assert.equal(setAck.status, 0x00);
    assert.equal(setAck.appliedLevel, 4);

    const getAck = await session.sendLogLevelGet(makeRequestId("log-level-get"));
    assert.equal(getAck.status, 0x00);
    assert.equal(getAck.appliedLevel, 4);
  } finally {
    unbindFirmware();
    await session.close();
    await firmwareTransport.close();
  }
});

test("HostSession sendLogLevelGet throws BitstreamAckStatusError on unsupported", async () => {
  const { left: hostTransport, right: firmwareTransport } = createLinkedInMemoryTransports();
  const session = new HostSession({
    transport: hostTransport,
    timeoutPolicy: {
      timeoutMs: 20,
      retryCount: 0,
    },
  });

  const firmwareDecode = new ProtocolEngine();
  const firmwareEncode = new BitstreamFrameEncoder();
  await firmwareTransport.open();

  const unbindFirmware = firmwareTransport.onData(async (chunk) => {
    const frames = firmwareDecode.feed(chunk);
    for (const frame of frames) {
      const cmd = frame.payload[0] ?? 0;
      if (cmd !== 0x0c) {
        continue;
      }
      const ackPayload = new Uint8Array([0x8b, 0x02, 0x02]);
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
    await assert.rejects(
      () => session.sendLogLevelGet(makeRequestId("log-level-unsupported")),
      (error: unknown) => {
        assert.ok(error instanceof BitstreamAckStatusError);
        assert.equal(error.kind, "control");
        assert.equal(error.code, 0x02);
        return true;
      },
    );
  } finally {
    unbindFirmware();
    await session.close();
    await firmwareTransport.close();
  }
});
