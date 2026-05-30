import { strict as assert } from "node:assert";
import { test } from "node:test";
import { crc16Ccitt } from "../../src/bitstream/utils/crc16.js";
import {
  tryDecodeDiagTaskSnapshotEnd0x93,
  tryDecodeDiagTaskSnapshotHeader0x91,
} from "../../src/bitstream/utils/diagTaskBatchV2.js";

test("snapshot header 0x91 round-trip crc", () => {
  const p = new Uint8Array(15);
  p[0] = 0x91;
  p[1] = 2;
  p[2] = 0;
  p[3] = 0x34;
  p[4] = 0x12;
  p[5] = 1;
  p[6] = 0;
  p[7] = 0x78;
  p[8] = 0x56;
  p[9] = 0x34;
  p[10] = 0x12;
  p[11] = 3;
  p[12] = 0;
  const c = crc16Ccitt(p, 0, 13);
  p[13] = c & 0xff;
  p[14] = (c >> 8) & 0xff;
  const r = tryDecodeDiagTaskSnapshotHeader0x91(p);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.header.epoch, 0x1234);
    assert.equal(r.header.seq, 1);
    assert.equal(r.header.timestampMs, 0x12345678);
    assert.equal(r.header.rowCount, 3);
  }
});

test("snapshot end 0x93 round-trip crc", () => {
  const p = new Uint8Array(9);
  p[0] = 0x93;
  p[1] = 2;
  p[2] = 0;
  p[3] = 0xaa;
  p[4] = 0;
  p[5] = 0x05;
  p[6] = 0;
  const c = crc16Ccitt(p, 0, 7);
  p[7] = c & 0xff;
  p[8] = (c >> 8) & 0xff;
  const r = tryDecodeDiagTaskSnapshotEnd0x93(p);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.epoch, 0x00aa);
    assert.equal(r.seq, 5);
  }
});
