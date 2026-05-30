import assert from "node:assert/strict";
import test from "node:test";
import { BITSTREAM_CHANNEL_WIFI } from "../../src/bitstream/frame/frame-types";
import type { BitstreamFrame } from "../../src/bitstream/frame/frame-types";
import {
  decodeWifiConnectAck,
  decodeWifiDisconnectAck,
  decodeWifiScanAck,
} from "../../src/bitstream/wifi/wifi-ack-decoders";

function makeWifiFrame(payload: number[]): BitstreamFrame {
  return {
    sequence: 1,
    channel: BITSTREAM_CHANNEL_WIFI,
    flags: 0,
    payload: Uint8Array.from(payload),
  };
}

test("Wi-Fi generic ACK layout: corr at [1:2], status at [3]", () => {
  /* 0x81 connect ACK: corr=0x0342, status=0 (OK) */
  const connect = decodeWifiConnectAck(makeWifiFrame([0x81, 0x42, 0x03, 0x00]));
  assert.equal(connect.corrId, 0x0342);
  assert.equal(connect.status, 0);

  const disc = decodeWifiDisconnectAck(makeWifiFrame([0x82, 0x01, 0x00, 0x00]));
  assert.equal(disc.corrId, 1);
  assert.equal(disc.status, 0);

  const scan = decodeWifiScanAck(makeWifiFrame([0x84, 0xff, 0x00, 0x00]));
  assert.equal(scan.corrId, 255);
  assert.equal(scan.status, 0);
});
