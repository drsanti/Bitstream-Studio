/**
 * Diagnostics task batch framing v2: snapshot header `0x91` and end marker `0x93`
 * (firmware `bitstream_diag_emit_task_snapshot_header_frames` / `_end_frames`).
 *
 * CRC16-CCITT matches {@link crc16Ccitt} / firmware `bitstream_protocol_crc16_ccitt`.
 */

import { crc16Ccitt } from "./crc16.js";

function toU16(payload: Uint8Array, offset: number): number {
  return (payload[offset] ?? 0) | ((payload[offset + 1] ?? 0) << 8);
}

function toU32(payload: Uint8Array, offset: number): number {
  return (
    ((payload[offset] ?? 0) |
      ((payload[offset + 1] ?? 0) << 8) |
      ((payload[offset + 2] ?? 0) << 16) |
      ((payload[offset + 3] ?? 0) << 24)) >>>
    0
  );
}

export interface DiagTaskSnapshotHeaderV2 {
  epoch: number;
  seq: number;
  timestampMs: number;
  rowCount: number;
}

/** Layout: [0]=0x91, maj, min, epoch u16, seq u32 ms u16 row_count, CRC16 LE over [0..12]. Length 15. */
export function tryDecodeDiagTaskSnapshotHeader0x91(
  payload: Uint8Array,
): { ok: true; header: DiagTaskSnapshotHeaderV2 } | { ok: false; reason: string } {
  if (payload.length !== 15) {
    return { ok: false, reason: `snapshot header bad length (${payload.length})` };
  }
  const crcExpected = toU16(payload, 13);
  const crcActual = crc16Ccitt(payload, 0, 13);
  if (crcActual !== crcExpected) {
    return {
      ok: false,
      reason: `snapshot header CRC mismatch (expected=0x${crcExpected.toString(16).padStart(4, "0")}, actual=0x${crcActual.toString(16).padStart(4, "0")})`,
    };
  }
  return {
    ok: true,
    header: {
      epoch: toU16(payload, 3),
      seq: toU16(payload, 5),
      timestampMs: toU32(payload, 7),
      rowCount: toU16(payload, 11),
    },
  };
}

/** Layout: [0]=0x93, maj, min, epoch u16, seq u16, CRC16 LE over [0..6]. Length 9. */
export function tryDecodeDiagTaskSnapshotEnd0x93(payload: Uint8Array):
  | { ok: true; epoch: number; seq: number }
  | { ok: false; reason: string } {
  if (payload.length !== 9) {
    return { ok: false, reason: `snapshot end bad length (${payload.length})` };
  }
  const crcExpected = toU16(payload, 7);
  const crcActual = crc16Ccitt(payload, 0, 7);
  if (crcActual !== crcExpected) {
    return {
      ok: false,
      reason: `snapshot end CRC mismatch (expected=0x${crcExpected.toString(16).padStart(4, "0")}, actual=0x${crcActual.toString(16).padStart(4, "0")})`,
    };
  }
  return {
    ok: true,
    epoch: toU16(payload, 3),
    seq: toU16(payload, 5),
  };
}
