import {
  BS2_RTC_STATUS_LEN,
  BS2_TIME_OP_RES_LEN,
} from "./commands";
import type { BitstreamRtcOpResult, BitstreamRtcStatusPayload } from "./store-types";

/** Decode TIME_GET RES body (`ipc_rtc_status_t`, 16 bytes). */
export function decodeRtcStatusBody(body: Uint8Array): BitstreamRtcStatusPayload | null {
  if (body.byteLength < BS2_RTC_STATUS_LEN)
  {
    return null;
  }
  const view = new DataView(body.buffer, body.byteOffset, body.byteLength);
  return {
    unixSec: view.getUint32(0, true),
    flags: view.getUint16(4, true),
    source: body[6] ?? 0,
    netSyncState: body[7] ?? 0,
    lastNetSyncUnix: view.getUint32(8, true),
    lastError: body[12] ?? 0,
  };
}

/** Decode TIME_SET / TIME_SYNC RES body (`status`, `error`). */
export function decodeRtcOpResultBody(body: Uint8Array): BitstreamRtcOpResult | null {
  if (body.byteLength < BS2_TIME_OP_RES_LEN)
  {
    return null;
  }
  return {
    status: body[0] ?? 0xff,
    error: body[1] ?? 0,
  };
}
