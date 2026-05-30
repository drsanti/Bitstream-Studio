/**
 * Decode diagnostics task-row event `0x83` (bridge / UI / MCP shared policy).
 *
 * Firmware (`bitstream_diag_build_task_item_payload`): ASCII task names + optional trailing **CRC16-CCITT**
 * over the full row bytes before CRC (length +2 vs legacy without CRC).
 * Policy: printable ASCII only (0x20–0x7E); non-printable → `?`.
 */

import { crc16Ccitt } from "./crc16.js";

/** Same field layout as `DiagTaskRowPayload` in `src/serialport-bridge/protocol.ts`. */
export interface DiagTaskRowDecoded {
  taskId: number;
  name: string;
  priority: number;
  state: number;
  stackAllocWords: number;
  stackFreeNowWords: number;
  stackMinEverWords: number;
  runTicks: number;
  runCount: number;
  waitTicks: number;
  flags: number;
  cpuPctX100: number;
  healthFlags: number;
}

export function decodeDiagTaskNameAsciiPrintable(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] ?? 0;
    out += b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : "?";
  }
  return out;
}

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

function parseDiagTaskRowBody(payload: Uint8Array, bodyLen: number, startOffset: number): DiagTaskRowDecoded | null {
  if (bodyLen < 32) return null;
  let offset = startOffset;
  const taskId = toU16(payload, offset);
  offset += 2;
  const nameLen = payload[offset] ?? 0;
  offset += 1;
  if (offset + nameLen + 26 !== bodyLen) return null;
  const nameBytes = payload.subarray(offset, offset + nameLen);
  const name = decodeDiagTaskNameAsciiPrintable(nameBytes);
  offset += nameLen;
  return {
    taskId,
    name,
    priority: payload[offset] ?? 0,
    state: payload[offset + 1] ?? 255,
    stackAllocWords: toU16(payload, offset + 2),
    stackFreeNowWords: toU16(payload, offset + 4),
    stackMinEverWords: toU16(payload, offset + 6),
    runTicks: toU32(payload, offset + 8),
    runCount: toU32(payload, offset + 12),
    waitTicks: toU32(payload, offset + 16),
    flags: toU16(payload, offset + 20),
    cpuPctX100: toU16(payload, offset + 22),
    healthFlags: toU16(payload, offset + 24),
  };
}

/**
 * Parse diagnostics channel payload whose first byte is `0x83`.
 * Supports **legacy** length (no CRC) and **v2** length (+2 byte CRC16 at end).
 */
export function decodeDiagTaskRowEvent0x83(payload: Uint8Array): DiagTaskRowDecoded | null {
  const parsed = tryDecodeDiagTaskRowEvent0x83(payload);
  return parsed.ok ? parsed.row : null;
}

function inferBodyLenFromPayloadLength(payloadLen: number): number | null {
  // bodyLen includes event header+fixed tail before optional CRC.
  // Accept either exact body length or body+CRC framing.
  if (payloadLen >= 34) {
    // Prefer CRC-framed length when possible.
    return payloadLen - 2;
  }
  if (payloadLen >= 32) {
    return payloadLen;
  }
  return null;
}

export type DecodeDiagTaskRow0x83Debug = {
  eventId: number;
  payloadLen: number;
  nameLen: number;
  nameHexPrefix: string;
  reason: string;
};

export function tryDecodeDiagTaskRowEvent0x83(
  payload: Uint8Array,
): { ok: true; row: DiagTaskRowDecoded } | { ok: false; debug: DecodeDiagTaskRow0x83Debug } {
  const eventId = payload[0] ?? 0;
  if (payload.length < 32) {
    return {
      ok: false,
      debug: {
        eventId,
        payloadLen: payload.length,
        nameLen: 0,
        nameHexPrefix: "",
        reason: "task item too short",
      },
    };
  }
  const allCandidates: Array<{ startOffset: number; nameLenOffset: number; nameStart: number; tag: string; event: number }> = [
    // Legacy/v2 row item from firmware: [evt,maj,min,taskId u16,nameLen,...]
    { startOffset: 3, nameLenOffset: 5, nameStart: 6, tag: "row83", event: 0x83 },
    // Snapshot-row variant used by some firmware builds: [evt,maj,min,epoch u16,seq u16,taskId u16,nameLen,...]
    { startOffset: 7, nameLenOffset: 9, nameStart: 10, tag: "row92", event: 0x92 },
  ];
  const candidates = allCandidates.filter((c) => c.event === eventId);
  if (candidates.length === 0) {
    return {
      ok: false,
      debug: {
        eventId,
        payloadLen: payload.length,
        nameLen: 0,
        nameHexPrefix: "",
        reason: `unsupported row event 0x${eventId.toString(16).padStart(2, "0")}`,
      },
    };
  }
  let lastCandidateReason = "";

  for (let ci = 0; ci < candidates.length; ci++) {
    const c = candidates[ci]!;
    if (payload.length <= c.nameLenOffset) {
      continue;
    }
    const nlenField = payload[c.nameLenOffset] ?? 0;
    const bodyLenFromField = (c.startOffset + 29) + nlenField;
    let bodyLen = bodyLenFromField;
    let lengthMatched =
      payload.length === bodyLenFromField || payload.length === bodyLenFromField + 2;
    // Fallback: some firmware rows occasionally carry inconsistent nameLen but valid full payload.
    if (!lengthMatched) {
      const inferred = inferBodyLenFromPayloadLength(payload.length);
      if (inferred != null) {
        const inferredNameLen = inferred - (c.startOffset + 29);
        if (inferredNameLen >= 0 && inferredNameLen <= 64) {
          bodyLen = inferred;
          lengthMatched = true;
          lastCandidateReason = `${c.tag}:fallback-nameLen field=${nlenField} inferred=${inferredNameLen}`;
        }
      }
    }
    if (!lengthMatched) {
      lastCandidateReason = `${c.tag}:len!=${bodyLenFromField}|${bodyLenFromField + 2} (nlen=${nlenField})`;
      continue;
    }

    if (payload.length === bodyLen + 2) {
      const expected = toU16(payload, bodyLen);
      const actual = crc16Ccitt(payload, 0, bodyLen);
      if (actual !== expected) {
        lastCandidateReason = `${c.tag}:crc expected=0x${expected.toString(16).padStart(4, "0")} actual=0x${actual.toString(16).padStart(4, "0")}`;
        continue;
      }
    }

    const row = parseDiagTaskRowBody(payload, bodyLen, c.startOffset);
    if (row) {
      return { ok: true, row };
    }
  }

  const nlen = payload[5] ?? 0;
  const nameSlice = payload.subarray(6, Math.min(22, payload.length));
  let nameHexPrefix = "";
  for (let i = 0; i < nameSlice.length; i++) {
    nameHexPrefix += (nameSlice[i] ?? 0).toString(16).padStart(2, "0");
  }
  return {
    ok: false,
    debug: {
      eventId,
      payloadLen: payload.length,
      nameLen: nlen,
      nameHexPrefix,
      reason: `task item layout/CRC mismatch${lastCandidateReason ? ` (${lastCandidateReason})` : ""}`,
    },
  };
}
