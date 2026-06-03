import {
  BS2_WIFI_EVT_KIND,
  BS2_WIFI_EVT_LINK_LEN,
  BS2_WIFI_EVT_SCAN_DONE_LEN,
  BS2_WIFI_EVT_SCAN_ROW_LEN,
  BS2_WIFI_SSID_BUF,
} from "./commands";

export type Bs2WifiLinkEvt = {
  kind: typeof BS2_WIFI_EVT_KIND.LINK;
  reqId: number;
  state: number;
  rssi: number;
  reason: number;
  ssid: string;
};

export type Bs2WifiScanRowEvt = {
  kind: typeof BS2_WIFI_EVT_KIND.SCAN_ROW;
  reqId: number;
  index: number;
  total: number;
  rssi: number;
  channel: number;
  security: number;
  ssid: string;
  bssid: Uint8Array;
};

export type Bs2WifiScanDoneEvt = {
  kind: typeof BS2_WIFI_EVT_KIND.SCAN_DONE;
  reqId: number;
  totalCount: number;
  status: number;
};

export type Bs2WifiPolicyEvt = {
  kind: typeof BS2_WIFI_EVT_KIND.POLICY;
  reqId: number;
  flags: number;
};

export type Bs2WifiStatusEvt =
  | Bs2WifiLinkEvt
  | Bs2WifiScanRowEvt
  | Bs2WifiScanDoneEvt
  | Bs2WifiPolicyEvt;

function decodeSsid33(payload: Uint8Array, offset: number): string {
  const slice = payload.slice(offset, offset + BS2_WIFI_SSID_BUF);
  const z = slice.indexOf(0);
  const dec = new TextDecoder();
  return dec.decode(z >= 0 ? slice.subarray(0, z) : slice).trimEnd();
}

/** Decode inner EVT_STATUS payload (after BS envelope unwrap). */
export function decodeWifiEvtStatus(payload: Uint8Array): Bs2WifiStatusEvt | null {
  if (payload.byteLength < 3) {
    return null;
  }

  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const reqId = view.getUint16(0, true);
  const kind = payload[2] ?? 0;

  if (kind === BS2_WIFI_EVT_KIND.LINK) {
    if (payload.byteLength < BS2_WIFI_EVT_LINK_LEN) {
      return null;
    }
    return {
      kind: BS2_WIFI_EVT_KIND.LINK,
      reqId,
      state: payload[3] ?? 0,
      rssi: view.getInt16(4, true),
      reason: view.getUint16(6, true),
      ssid: decodeSsid33(payload, 8),
    };
  }

  if (kind === BS2_WIFI_EVT_KIND.SCAN_ROW) {
    if (payload.byteLength < BS2_WIFI_EVT_SCAN_ROW_LEN) {
      return null;
    }
    return {
      kind: BS2_WIFI_EVT_KIND.SCAN_ROW,
      reqId,
      index: view.getUint16(3, true),
      total: view.getUint16(5, true),
      rssi: view.getInt16(7, true),
      channel: payload[9] ?? 0,
      security: view.getUint32(10, true),
      ssid: decodeSsid33(payload, 14),
      bssid: payload.slice(47, 53),
    };
  }

  if (kind === BS2_WIFI_EVT_KIND.SCAN_DONE) {
    if (payload.byteLength < BS2_WIFI_EVT_SCAN_DONE_LEN) {
      return null;
    }
    return {
      kind: BS2_WIFI_EVT_KIND.SCAN_DONE,
      reqId,
      totalCount: view.getUint16(3, true),
      status: view.getUint16(5, true),
    };
  }

  if (kind === BS2_WIFI_EVT_KIND.POLICY) {
    if (payload.byteLength < 4) {
      return null;
    }
    return {
      kind: BS2_WIFI_EVT_KIND.POLICY,
      reqId,
      flags: payload[3] ?? 0,
    };
  }

  return null;
}

/** RES body for WIFI_STATUS_GET (38 bytes). */
export function decodeWifiStatusSnapshot(body: Uint8Array): Omit<Bs2WifiLinkEvt, "kind" | "reqId"> | null {
  if (body.byteLength < 38) {
    return null;
  }
  const view = new DataView(body.buffer, body.byteOffset, body.byteLength);
  return {
    state: body[0] ?? 0,
    rssi: view.getInt16(1, true),
    reason: view.getUint16(3, true),
    ssid: decodeSsid33(body, 5),
  };
}
