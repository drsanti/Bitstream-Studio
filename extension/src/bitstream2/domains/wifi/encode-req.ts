import { BS2_WIFI_PASSWORD_BUF, BS2_WIFI_SSID_BUF } from "./commands";

function writeFixedCString(out: Uint8Array, offset: number, maxLen: number, text: string): void {
  const enc = new TextEncoder();
  const raw = enc.encode(text);
  const n = Math.min(maxLen - 1, raw.length);
  out.fill(0, offset, offset + maxLen);
  out.set(raw.subarray(0, n), offset);
}

/** REQ body for WIFI_CONNECT (102 bytes). */
export function encodeWifiConnectBody(
  security: number,
  ssid: string,
  password: string,
): Uint8Array {
  const body = new Uint8Array(102);
  const view = new DataView(body.buffer);
  view.setUint32(0, security >>> 0, true);
  writeFixedCString(body, 4, BS2_WIFI_SSID_BUF, ssid);
  writeFixedCString(body, 4 + BS2_WIFI_SSID_BUF, BS2_WIFI_PASSWORD_BUF, password);
  return body;
}

/** REQ body for WIFI_SCAN_SSID. */
export function encodeWifiScanSsidBody(ssid: string): Uint8Array {
  const enc = new TextEncoder();
  const raw = enc.encode(ssid);
  const n = Math.min(32, raw.length);
  const body = new Uint8Array(1 + n);
  body[0] = n & 0xff;
  body.set(raw.subarray(0, n), 1);
  return body;
}

/** REQ body for WIFI_POLICY_SET. */
export function encodeWifiPolicySetBody(autoConnectEnabled: boolean): Uint8Array {
  return Uint8Array.of(autoConnectEnabled ? 0x01 : 0x00);
}
