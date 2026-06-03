import type { BitstreamRtcStatusPayload } from "./store-types";

/** Encode `ipc_rtc_status_t` for simulator TIME_GET RES. */
export function encodeRtcStatusBody(status: BitstreamRtcStatusPayload): Uint8Array {
  const body = new Uint8Array(16);
  const view = new DataView(body.buffer);
  view.setUint32(0, status.unixSec >>> 0, true);
  view.setUint16(4, status.flags & 0xffff, true);
  body[6] = status.source & 0xff;
  body[7] = status.netSyncState & 0xff;
  view.setUint32(8, status.lastNetSyncUnix >>> 0, true);
  body[12] = status.lastError & 0xff;
  return body;
}
