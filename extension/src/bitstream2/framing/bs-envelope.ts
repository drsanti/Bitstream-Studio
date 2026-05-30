import { crc16CcittFalse } from "./crc16";
import { BS_PREFIX_BYTES } from "./limits";
import type { BsEnvelopeFrame, BsType } from "../protocol/types";

export type BsEncodedEnvelope = {
  /** Full wire bytes including prefix + len + type + payload + crc + crlf. */
  bytes: Uint8Array;
};

export function encodeBsEnvelope(frame: { type: BsType; payload: Uint8Array }): BsEncodedEnvelope {
  const len = frame.payload.byteLength & 0xffff;
  const total = 3 + 2 + 1 + len + 2 + 2;
  const out = new Uint8Array(total);
  let o = 0;
  out.set(BS_PREFIX_BYTES, o);
  o += 3;
  out[o++] = len & 0xff;
  out[o++] = (len >> 8) & 0xff;
  out[o++] = frame.type & 0xff;
  out.set(frame.payload, o);
  o += len;
  const crc = crc16CcittFalse(out, 3, 2 + 1 + len); // LEN + TYPE + PAYLOAD
  out[o++] = crc & 0xff;
  out[o++] = (crc >> 8) & 0xff;
  out[o++] = 0x0d;
  out[o++] = 0x0a;
  return { bytes: out };
}

export type BsEnvelopeValidateResult =
  | { ok: true; frame: BsEnvelopeFrame }
  | { ok: false; reason: "crc" | "crlf" | "length" };

/**
 * Validate a complete wire envelope starting at offset 0.
 * The caller must ensure `bytes` begins with `BS `.
 */
export function validateBsEnvelope(bytes: Uint8Array, maxLen: number): BsEnvelopeValidateResult {
  if (bytes.byteLength < 3 + 2 + 1 + 2 + 2) {
    return { ok: false, reason: "length" };
  }
  const len = (bytes[3] ?? 0) | ((bytes[4] ?? 0) << 8);
  if (len > maxLen) {
    return { ok: false, reason: "length" };
  }
  const needed = 3 + 2 + 1 + len + 2 + 2;
  if (bytes.byteLength < needed) {
    return { ok: false, reason: "length" };
  }
  const cr = bytes[needed - 2] ?? 0;
  const lf = bytes[needed - 1] ?? 0;
  if (cr !== 0x0d || lf !== 0x0a) {
    return { ok: false, reason: "crlf" };
  }
  const crcExpected = (bytes[3 + 2 + 1 + len] ?? 0) | ((bytes[3 + 2 + 1 + len + 1] ?? 0) << 8);
  const crcActual = crc16CcittFalse(bytes, 3, 2 + 1 + len);
  if (crcActual !== crcExpected) {
    return { ok: false, reason: "crc" };
  }
  const type = bytes[5] ?? 0;
  const payloadStart = 6;
  const payloadEnd = payloadStart + len;
  return {
    ok: true,
    frame: {
      type,
      len,
      payload: bytes.slice(payloadStart, payloadEnd),
    },
  };
}

