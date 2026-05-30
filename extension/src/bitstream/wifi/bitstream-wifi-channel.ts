/**
 * Wi-Fi Bitstream channel — mirrors CM55 `BITSTREAM_CHANNEL_WIFI` (`0x06`) and
 * message IDs in `proj_cm55/.../bitstream_protocol.h`.
 *
 * Use `BITSTREAM_CHANNEL_WIFI` from `../frame/frame-types` (single definition).
 */

export const BITSTREAM_MSG_WIFI_CONNECT_REQ = 0x01;
export const BITSTREAM_MSG_WIFI_DISCONNECT_REQ = 0x02;
export const BITSTREAM_MSG_WIFI_STATUS_POLL_REQ = 0x03;
export const BITSTREAM_MSG_WIFI_SCAN_ALL_REQ = 0x04;
export const BITSTREAM_MSG_WIFI_SCAN_SSID_REQ = 0x05;
export const BITSTREAM_MSG_WIFI_POLICY_GET_REQ = 0x06;
export const BITSTREAM_MSG_WIFI_POLICY_SET_REQ = 0x07;

export const BITSTREAM_MSG_WIFI_CONNECT_ACK = 0x81;
export const BITSTREAM_MSG_WIFI_DISCONNECT_ACK = 0x82;
export const BITSTREAM_MSG_WIFI_STATUS_POLL_ACK = 0x83;
export const BITSTREAM_MSG_WIFI_SCAN_ACK = 0x84;
export const BITSTREAM_MSG_WIFI_POLICY_ACK = 0x85;

export const BITSTREAM_MSG_WIFI_STATUS_EVT = 0xa0;
export const BITSTREAM_MSG_WIFI_SCAN_COMPLETE_EVT = 0xa1;
export const BITSTREAM_MSG_WIFI_POLICY_EVT = 0xa2;

/** Bytes: cmd(1) + corr_id(2) + security(4) + ssid[33] + password[65]. */
export const BITSTREAM_WIFI_CONNECT_REQ_PAYLOAD_LEN = 105;

/** Bytes: cmd(1) + corr_id(2) + state(1) + rssi(2 LE) + reason(2 LE) + ssid[33]. */
export const BITSTREAM_WIFI_STATUS_PAYLOAD_LEN = 41;

/** Bytes: cmd(1) + total_count(2 LE) + status(2 LE). */
export const BITSTREAM_WIFI_SCAN_COMPLETE_PAYLOAD_LEN = 5;
export const BITSTREAM_WIFI_POLICY_ACK_PAYLOAD_LEN = 5;

/** CAPS_ACK flag: firmware advertises Wi-Fi channel (`BITSTREAM_CAPS_FLAG_WIFI_CHANNEL_0X06`). */
export const BITSTREAM_CAPS_FLAG_WIFI_CHANNEL = 1 << 5;
export const BITSTREAM_CAPS_FLAG_WIFI_POLICY_CONTROL = 1 << 6;
/** CAPS_ACK flag: firmware advertises control-channel LOG_LEVEL GET/SET support. */
export const BITSTREAM_CAPS_FLAG_LOG_LEVEL_CONTROL = 1 << 7;
export const BITSTREAM_WIFI_POLICY_FLAG_AUTO_CONNECT_ENABLED = 1 << 0;
