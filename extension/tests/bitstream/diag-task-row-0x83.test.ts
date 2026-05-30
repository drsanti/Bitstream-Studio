import { strict as assert } from "node:assert";
import { test } from "node:test";
import { crc16Ccitt } from "../../src/bitstream/utils/crc16.js";
import {
  decodeDiagTaskNameAsciiPrintable,
  decodeDiagTaskRowEvent0x83,
} from "../../src/bitstream/utils/diagTaskRow0x83.js";

function appendRowCrc(rowWithoutCrc: Uint8Array): Uint8Array {
  const bodyLen = rowWithoutCrc.length;
  const c = crc16Ccitt(rowWithoutCrc, 0, bodyLen);
  const out = new Uint8Array(bodyLen + 2);
  out.set(rowWithoutCrc);
  out[bodyLen] = c & 0xff;
  out[bodyLen + 1] = (c >> 8) & 0xff;
  return out;
}

test("decodeDiagTaskNameAsciiPrintable replaces non-printable", () => {
  const bytes = new Uint8Array([0x41, 0xff, 0x7e, 0x0a]);
  assert.equal(decodeDiagTaskNameAsciiPrintable(bytes), "A?~?");
});

test("decodeDiagTaskRowEvent0x83 empty name legacy (no crc)", () => {
  const pl = new Uint8Array(32);
  pl[0] = 0x83;
  pl[1] = 2;
  pl[2] = 0;
  pl[3] = 0x34;
  pl[4] = 0x12;
  pl[5] = 0;
  const row = decodeDiagTaskRowEvent0x83(pl);
  assert.ok(row);
  assert.equal(row!.taskId, 0x1234);
  assert.equal(row!.name, "");
});

test("decodeDiagTaskRowEvent0x83 with crc16 footer", () => {
  const pl = new Uint8Array(32);
  pl[0] = 0x83;
  pl[1] = 2;
  pl[2] = 0;
  pl[3] = 0x01;
  pl[4] = 0;
  pl[5] = 0;
  const withCrc = appendRowCrc(pl);
  const row = decodeDiagTaskRowEvent0x83(withCrc);
  assert.ok(row);
  assert.equal(row!.taskId, 1);
});

test("decodeDiagTaskRowEvent0x83 name AB + crc", () => {
  const pl = new Uint8Array(34);
  pl[0] = 0x83;
  pl[1] = 2;
  pl[2] = 0;
  pl[3] = 0x01;
  pl[4] = 0;
  pl[5] = 2;
  pl[6] = 0x41;
  pl[7] = 0x42;
  const withCrc = appendRowCrc(pl);
  const row = decodeDiagTaskRowEvent0x83(withCrc);
  assert.ok(row);
  assert.equal(row!.name, "AB");
});
