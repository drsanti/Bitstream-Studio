/** Decoded `ipc_rtc_status_t` from TIME_GET RES body (16 bytes). */
export type BitstreamRtcStatusPayload = {
  unixSec: number;
  flags: number;
  source: number;
  netSyncState: number;
  lastNetSyncUnix: number;
  lastError: number;
};

export type BitstreamRtcOpResult = {
  status: number;
  error: number;
};
