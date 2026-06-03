/** Wi‑Fi UI store shapes (BS2 EVT_STATUS / STATUS_GET RES). */

export type BitstreamWifiStatusSource = "evt_status" | "status_get_res";

export type BitstreamWifiStatusPayload = {
  reqId: number;
  state: number;
  rssi: number;
  reason: number;
  ssid: string;
};

export type BitstreamWifiScanRow = {
  index: number;
  total: number;
  rssi: number;
  channel: number;
  security: number;
  ssid: string;
  bssid: Uint8Array;
};

export type BitstreamWifiScanCompletePayload = {
  reqId: number;
  totalCount: number;
  status: number;
};

export type BitstreamWifiTxKind =
  | "connect"
  | "disconnect"
  | "status_poll"
  | "scan_all"
  | "scan_ssid"
  | "policy_get"
  | "policy_set";
