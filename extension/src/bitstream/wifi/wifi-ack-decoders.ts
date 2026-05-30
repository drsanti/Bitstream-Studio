import { BITSTREAM_CHANNEL_WIFI } from "../frame/frame-types";
import type { BitstreamFrame } from "../frame/frame-types";
import {
  BITSTREAM_MSG_WIFI_CONNECT_ACK,
  BITSTREAM_MSG_WIFI_DISCONNECT_ACK,
  BITSTREAM_MSG_WIFI_POLICY_ACK,
  BITSTREAM_MSG_WIFI_POLICY_EVT,
  BITSTREAM_MSG_WIFI_SCAN_ACK,
  BITSTREAM_MSG_WIFI_STATUS_POLL_ACK,
  BITSTREAM_WIFI_POLICY_FLAG_AUTO_CONNECT_ENABLED,
} from "./bitstream-wifi-channel";

export interface WifiSimpleAck {
  ackId: number;
  status: number;
  corrId: number;
}

export interface WifiConnectAck extends WifiSimpleAck {}
export interface WifiPolicyAck extends WifiSimpleAck {
  flags: number;
  autoConnectEnabled: boolean;
}

function expectWifiChannel(frame: BitstreamFrame): void {
  if (frame.channel !== BITSTREAM_CHANNEL_WIFI) {
    throw new Error(`Unexpected channel ${frame.channel}, expected Wi-Fi (0x06)`);
  }
}

function expectMinLength(payload: Uint8Array, n: number, name: string): void {
  if (payload.length < n) {
    throw new Error(`Invalid ${name} payload length ${payload.length}, expected >= ${n}`);
  }
}

/** Firmware (`wifi_svc_send_ack_*`): [0]=ACK id, [1:2]=corr_id LE, [3]=status. */
export function decodeWifiConnectAck(frame: BitstreamFrame): WifiConnectAck {
  expectWifiChannel(frame);
  expectMinLength(frame.payload, 4, "WIFI_CONNECT_ACK");
  if ((frame.payload[0] ?? 0) !== BITSTREAM_MSG_WIFI_CONNECT_ACK) {
    throw new Error(`Unexpected Wi-Fi ACK id ${frame.payload[0] ?? -1}, expected 0x81`);
  }
  const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
  return {
    ackId: frame.payload[0] ?? 0,
    corrId: view.getUint16(1, true),
    status: frame.payload[3] ?? 0,
  };
}

export function decodeWifiDisconnectAck(frame: BitstreamFrame): WifiSimpleAck {
  expectWifiChannel(frame);
  expectMinLength(frame.payload, 4, "WIFI_DISCONNECT_ACK");
  if ((frame.payload[0] ?? 0) !== BITSTREAM_MSG_WIFI_DISCONNECT_ACK) {
    throw new Error(`Unexpected Wi-Fi ACK id ${frame.payload[0] ?? -1}, expected 0x82`);
  }
  const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
  return {
    ackId: frame.payload[0] ?? 0,
    corrId: view.getUint16(1, true),
    status: frame.payload[3] ?? 0,
  };
}

/**
 * Status poll response uses the same 41-byte layout as `WIFI_STATUS_EVT` with msg id 0x83.
 * Decoded separately in `decodeWifiStatusLikePayload` for field data; this only validates the frame.
 */
export function decodeWifiStatusPollAckFrame(frame: BitstreamFrame): void {
  expectWifiChannel(frame);
  expectMinLength(frame.payload, 41, "WIFI_STATUS_POLL_ACK");
  if ((frame.payload[0] ?? 0) !== BITSTREAM_MSG_WIFI_STATUS_POLL_ACK) {
    throw new Error(`Unexpected Wi-Fi message id ${frame.payload[0] ?? -1}, expected 0x83`);
  }
}

export function decodeWifiScanAck(frame: BitstreamFrame): WifiSimpleAck {
  expectWifiChannel(frame);
  expectMinLength(frame.payload, 4, "WIFI_SCAN_ACK");
  if ((frame.payload[0] ?? 0) !== BITSTREAM_MSG_WIFI_SCAN_ACK) {
    throw new Error(`Unexpected Wi-Fi ACK id ${frame.payload[0] ?? -1}, expected 0x84`);
  }
  const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
  return {
    ackId: frame.payload[0] ?? 0,
    corrId: view.getUint16(1, true),
    status: frame.payload[3] ?? 0,
  };
}

export function decodeWifiPolicyAck(frame: BitstreamFrame): WifiPolicyAck {
  expectWifiChannel(frame);
  expectMinLength(frame.payload, 5, "WIFI_POLICY_ACK");
  if ((frame.payload[0] ?? 0) !== BITSTREAM_MSG_WIFI_POLICY_ACK) {
    throw new Error(`Unexpected Wi-Fi ACK id ${frame.payload[0] ?? -1}, expected 0x85`);
  }
  const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
  const flags = frame.payload[4] ?? 0;
  return {
    ackId: frame.payload[0] ?? 0,
    corrId: view.getUint16(1, true),
    status: frame.payload[3] ?? 0,
    flags,
    autoConnectEnabled: (flags & BITSTREAM_WIFI_POLICY_FLAG_AUTO_CONNECT_ENABLED) !== 0,
  };
}

export function decodeWifiPolicyEvt(frame: BitstreamFrame): WifiPolicyAck | null {
  expectWifiChannel(frame);
  expectMinLength(frame.payload, 5, "WIFI_POLICY_EVT");
  if ((frame.payload[0] ?? 0) !== BITSTREAM_MSG_WIFI_POLICY_EVT) {
    return null;
  }
  const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
  const flags = frame.payload[4] ?? 0;
  return {
    ackId: frame.payload[0] ?? 0,
    corrId: view.getUint16(1, true),
    status: frame.payload[3] ?? 0,
    flags,
    autoConnectEnabled: (flags & BITSTREAM_WIFI_POLICY_FLAG_AUTO_CONNECT_ENABLED) !== 0,
  };
}
