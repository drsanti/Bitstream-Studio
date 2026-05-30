/**
 * Encode/decode Wi‑Fi channel payloads (must match `bitstream_wifi_service.c` on CM55).
 */

import {
  BITSTREAM_MSG_WIFI_SCAN_COMPLETE_EVT,
  BITSTREAM_MSG_WIFI_STATUS_EVT,
  BITSTREAM_MSG_WIFI_STATUS_POLL_ACK,
  BITSTREAM_WIFI_POLICY_FLAG_AUTO_CONNECT_ENABLED,
  BITSTREAM_WIFI_CONNECT_REQ_PAYLOAD_LEN,
  BITSTREAM_WIFI_SCAN_COMPLETE_PAYLOAD_LEN,
  BITSTREAM_WIFI_STATUS_PAYLOAD_LEN,
} from "./bitstream-wifi-channel";

/** SSID/password buffer sizes including null terminator (firmware `BITSTREAM_WIFI_*`). */
export const WIFI_SSID_BUF = 33;
export const WIFI_PASSWORD_BUF = 65;

export interface BitstreamWifiStatusPayload {
  msgId: number;
  corrId: number;
  state: number;
  rssi: number;
  reason: number;
  ssid: string;
}

export interface BitstreamWifiScanCompletePayload {
  totalCount: number;
  status: number;
}

function writeFixedCString(out: Uint8Array, offset: number, maxLen: number, text: string): void {
  const enc = new TextEncoder();
  const raw = enc.encode(text);
  const n = Math.min(maxLen - 1, raw.length);
  out.fill(0, offset, offset + maxLen);
  out.set(raw.subarray(0, n), offset);
}

/**
 * Body after command byte for CONNECT: corr(2 LE) + security(4 LE) + ssid[33] + password[65].
 */
export function encodeWifiConnectBody(
  corrId: number,
  security: number,
  ssid: string,
  password: string,
): Uint8Array {
  const body = new Uint8Array(BITSTREAM_WIFI_CONNECT_REQ_PAYLOAD_LEN - 1);
  const view = new DataView(body.buffer);
  view.setUint16(0, corrId & 0xffff, true);
  view.setUint32(2, security >>> 0, true);
  writeFixedCString(body, 6, WIFI_SSID_BUF, ssid);
  writeFixedCString(body, 6 + WIFI_SSID_BUF, WIFI_PASSWORD_BUF, password);
  return body;
}

/** Body after command byte: corr(2 LE) only. */
export function encodeWifiCorrBody(corrId: number): Uint8Array {
  const body = new Uint8Array(2);
  const view = new DataView(body.buffer);
  view.setUint16(0, corrId & 0xffff, true);
  return body;
}

/** Body after command byte: corr(2 LE) + len(1) + ssid bytes (len ≤ 32). */
export function encodeWifiScanSsidBody(corrId: number, ssid: string): Uint8Array {
  const enc = new TextEncoder();
  const raw = enc.encode(ssid);
  const n = Math.min(32, raw.length);
  const body = new Uint8Array(3 + n);
  const view = new DataView(body.buffer);
  view.setUint16(0, corrId & 0xffff, true);
  body[2] = n & 0xff;
  body.set(raw.subarray(0, n), 3);
  return body;
}

/** Body after command byte for WIFI_POLICY_SET: corr(2 LE) + flags(1). */
export function encodeWifiPolicySetBody(corrId: number, autoConnectEnabled: boolean): Uint8Array {
  const body = new Uint8Array(3);
  const view = new DataView(body.buffer);
  view.setUint16(0, corrId & 0xffff, true);
  body[2] = autoConnectEnabled ? BITSTREAM_WIFI_POLICY_FLAG_AUTO_CONNECT_ENABLED : 0;
  return body;
}

export function decodeWifiStatusLikePayload(payload: Uint8Array): BitstreamWifiStatusPayload | null {
  if (payload.length < BITSTREAM_WIFI_STATUS_PAYLOAD_LEN) {
    return null;
  }
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const ssidBytes = payload.slice(8, 8 + 33);
  const z = ssidBytes.indexOf(0);
  const ssidDec = new TextDecoder();
  const ssid = ssidDec.decode(z >= 0 ? ssidBytes.subarray(0, z) : ssidBytes).trimEnd();
  return {
    msgId: payload[0] ?? 0,
    corrId: view.getUint16(1, true),
    state: payload[3] ?? 0,
    rssi: view.getInt16(4, true),
    reason: view.getUint16(6, true),
    ssid,
  };
}

export function decodeWifiScanCompletePayload(payload: Uint8Array): BitstreamWifiScanCompletePayload | null {
  if (payload.length < BITSTREAM_WIFI_SCAN_COMPLETE_PAYLOAD_LEN) {
    return null;
  }
  if ((payload[0] ?? 0) !== BITSTREAM_MSG_WIFI_SCAN_COMPLETE_EVT) {
    return null;
  }
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  return {
    totalCount: view.getUint16(1, true),
    status: view.getUint16(3, true),
  };
}

export function isWifiStatusLikePayload(payload: Uint8Array): boolean {
  const id = payload[0] ?? 0;
  return id === BITSTREAM_MSG_WIFI_STATUS_EVT || id === BITSTREAM_MSG_WIFI_STATUS_POLL_ACK;
}
