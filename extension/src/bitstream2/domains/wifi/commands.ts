/** BS2 Wi-Fi cmdId (REQ body after reqId/flags). */
export const BS2_WIFI_CMD = {
  CONNECT: 0x20,
  DISCONNECT: 0x21,
  SCAN_ALL: 0x22,
  SCAN_SSID: 0x23,
  STATUS_GET: 0x24,
  POLICY_GET: 0x25,
  POLICY_SET: 0x26,
} as const;

export const BS2_WIFI_EVT_KIND = {
  LINK: 0x01,
  SCAN_ROW: 0x02,
  SCAN_DONE: 0x03,
  POLICY: 0x04,
} as const;

export const BS2_WIFI_EVT_LINK_LEN = 41;
export const BS2_WIFI_EVT_SCAN_ROW_LEN = 53;
export const BS2_WIFI_EVT_SCAN_DONE_LEN = 7;
export const BS2_WIFI_STATUS_SNAPSHOT_LEN = 38;

export const BS2_WIFI_SSID_BUF = 33;
export const BS2_WIFI_PASSWORD_BUF = 65;
