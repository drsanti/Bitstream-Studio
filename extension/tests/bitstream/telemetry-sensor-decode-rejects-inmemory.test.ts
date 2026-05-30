import assert from "node:assert/strict";
import test from "node:test";

import {
  BITSTREAM_CHANNEL_SENSOR,
  BitstreamFrameEncoder,
  HostSession,
  createLinkedInMemoryTransports,
} from "../../src/bitstream";

/**
 * Mirrors the webview **`useBitstreamSession`** rule: **`channel === 0x01`** and decoded event
 * **`name === "UNKNOWN"`** (sensor payload did not become **`SENSOR_SAMPLE_V2`**).
 * See **`BITSTREAM_TELEMETRY_STALE_PIPELINE.md`** § P4 (automated verification).
 */
test("HostSession emits UNKNOWN for undecodable sensor 0x01 frames (single-byte payload)", async () => {
  const { left: hostTransport, right: firmwareTransport } = createLinkedInMemoryTransports();
  const session = new HostSession({
    transport: hostTransport,
    timeoutPolicy: { timeoutMs: 80, retryCount: 0 },
  });

  let unknownSensorEvents = 0;
  const unbind = session.onEvent((event) => {
    if (event.channel === BITSTREAM_CHANNEL_SENSOR && event.name === "UNKNOWN") {
      unknownSensorEvents += 1;
    }
  });

  const encode = new BitstreamFrameEncoder();
  await firmwareTransport.open();
  await session.open();

  const badPayload = new Uint8Array([0x00]);
  const badFrame = encode.encodeWithSequence(1, BITSTREAM_CHANNEL_SENSOR, 0, badPayload);
  await firmwareTransport.write(badFrame);

  assert.equal(unknownSensorEvents, 1);

  unbind();
  await session.close();
  await firmwareTransport.close();
});

test("HostSession counts multiple UNKNOWN sensor 0x01 frames independently", async () => {
  const { left: hostTransport, right: firmwareTransport } = createLinkedInMemoryTransports();
  const session = new HostSession({
    transport: hostTransport,
    timeoutPolicy: { timeoutMs: 80, retryCount: 0 },
  });

  let unknownSensorEvents = 0;
  const unbind = session.onEvent((event) => {
    if (event.channel === BITSTREAM_CHANNEL_SENSOR && event.name === "UNKNOWN") {
      unknownSensorEvents += 1;
    }
  });

  const encode = new BitstreamFrameEncoder();
  await firmwareTransport.open();
  await session.open();

  for (let seq = 1; seq <= 3; seq += 1) {
    const badFrame = encode.encodeWithSequence(
      seq,
      BITSTREAM_CHANNEL_SENSOR,
      0,
      new Uint8Array([0xff, seq]),
    );
    await firmwareTransport.write(badFrame);
  }

  assert.equal(unknownSensorEvents, 3);

  unbind();
  await session.close();
  await firmwareTransport.close();
});
