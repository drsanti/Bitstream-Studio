import type { DiagSnapshotData } from "../types/diagSnapshot";

/** Diagnostics channel event id for snapshot body (`BITSTREAM_DIAG_EVT_SNAPSHOT` on firmware). */
export const DIAG_SNAPSHOT_EVENT_ID = 0x81;

export const DIAG_SNAPSHOT_PAYLOAD_MIN_LEN = 47;

/**
 * Decode a diagnostics-channel payload into {@link DiagSnapshotData}.
 * Used for `DIAG_GET_SNAPSHOT` replies and unsolicited snapshot frames from the periodic diag stream.
 */
export function decodeDiagSnapshotPayload(payload: Uint8Array): DiagSnapshotData | null {
  if (payload.length < DIAG_SNAPSHOT_PAYLOAD_MIN_LEN) {
    return null;
  }
  if ((payload[0] ?? 0) !== DIAG_SNAPSHOT_EVENT_ID) {
    return null;
  }
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  return {
    atMs: view.getUint32(3, true),
    cpuLoadPctX100: view.getUint16(11, true),
    idlePctX100: view.getUint16(13, true),
    heapFreeBytes: view.getUint32(15, true),
    heapMinEverFreeBytes: view.getUint32(19, true),
    taskCount: view.getUint16(23, true),
    streamOverrunCount: view.getUint16(25, true),
    streamGlobalPeriodMs: view.getUint16(27, true),
    tickHz: view.getUint16(29, true),
    faultFlags: view.getUint16(31, true),
    sampledTaskCount: view.getUint16(33, true),
    runtimeTaskCount: view.getUint16(35, true),
    runtimeTotal: view.getUint32(37, true),
    runtimeListed: view.getUint32(41, true),
    unattributedCpuPctX100: view.getUint16(45, true),
  };
}
