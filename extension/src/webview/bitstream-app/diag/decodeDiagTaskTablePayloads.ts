import type { DiagTaskRow } from "../types/diagTaskTable";
import { decodeDiagTaskRowEvent0x83 } from "../../../bitstream/utils/diagTaskRow0x83.js";

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

export type DecodedDiagTaskHeader = {
  timestampMs: number;
  expectedTaskCount: number;
};

export function decodeDiagTaskListHeaderPayload(
  payload: Uint8Array,
): DecodedDiagTaskHeader | null {
  // [0]=0x82, [1]=major, [2]=minor, then u32 timestampMs @3, u16 taskCount @7
  if (payload.length < 9) {
    return null;
  }
  return {
    timestampMs: toU32(payload, 3),
    expectedTaskCount: toU16(payload, 7),
  };
}

export type DecodedDiagTaskItem = Omit<DiagTaskRow, "lastRunAtMs">;

export function decodeDiagTaskItemPayload(payload: Uint8Array): DecodedDiagTaskItem | null {
  return decodeDiagTaskRowEvent0x83(payload);
}

