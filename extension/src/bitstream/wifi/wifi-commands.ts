import type { BitstreamCommandDefinition } from "../commands/command-types";

export const WIFI_CONNECT_REQ: BitstreamCommandDefinition = {
  name: "WIFI_CONNECT_REQ",
  channel: 0x06,
  commandId: 0x01,
};

export const WIFI_DISCONNECT_REQ: BitstreamCommandDefinition = {
  name: "WIFI_DISCONNECT_REQ",
  channel: 0x06,
  commandId: 0x02,
};

export const WIFI_STATUS_POLL_REQ: BitstreamCommandDefinition = {
  name: "WIFI_STATUS_POLL_REQ",
  channel: 0x06,
  commandId: 0x03,
};

export const WIFI_SCAN_ALL_REQ: BitstreamCommandDefinition = {
  name: "WIFI_SCAN_ALL_REQ",
  channel: 0x06,
  commandId: 0x04,
};

export const WIFI_SCAN_SSID_REQ: BitstreamCommandDefinition = {
  name: "WIFI_SCAN_SSID_REQ",
  channel: 0x06,
  commandId: 0x05,
};

export const WIFI_POLICY_GET_REQ: BitstreamCommandDefinition = {
  name: "WIFI_POLICY_GET_REQ",
  channel: 0x06,
  commandId: 0x06,
};

export const WIFI_POLICY_SET_REQ: BitstreamCommandDefinition = {
  name: "WIFI_POLICY_SET_REQ",
  channel: 0x06,
  commandId: 0x07,
};
