import { create } from "zustand";
import type { BitstreamWifiScanCompletePayload, BitstreamWifiStatusPayload } from "../../../bitstream/wifi/bitstream-wifi-payload";

export type BitstreamWifiStatusSource = "async_evt" | "poll_ack";

export type BitstreamWifiTxKind =
  | "connect"
  | "disconnect"
  | "status_poll"
  | "scan_all"
  | "scan_ssid"
  | "policy_get"
  | "policy_set";

export type BitstreamWifiTxMeta = {
  kind: BitstreamWifiTxKind;
  corrId: number;
  atMs: number;
};

export type BitstreamWifiRxMeta = {
  msgId: number;
  seq: number;
  len: number;
  atMs: number;
};

export type BitstreamWifiSyncState = "idle" | "syncing" | "ok" | "error";

export type BitstreamWifiSyncMeta = {
  state: BitstreamWifiSyncState;
  lastAttemptAtMs: number | null;
  lastOkAtMs: number | null;
  lastError: string | null;
};

export interface BitstreamWifiStateSlice {
  lastStatus: BitstreamWifiStatusPayload | null;
  lastStatusSource: BitstreamWifiStatusSource | null;
  lastScanComplete: BitstreamWifiScanCompletePayload | null;
  autoConnectEnabled: boolean | null;
  lastUpdatedAt: number | null;
  lastTx: BitstreamWifiTxMeta | null;
  lastRx: BitstreamWifiRxMeta | null;
  wifiSync: BitstreamWifiSyncMeta;
}

interface BitstreamWifiActions {
  applyStatus: (payload: BitstreamWifiStatusPayload, source: BitstreamWifiStatusSource) => void;
  applyScanComplete: (payload: BitstreamWifiScanCompletePayload) => void;
  applyPolicy: (autoConnectEnabled: boolean) => void;
  applyTx: (meta: Omit<BitstreamWifiTxMeta, "atMs">) => void;
  applyRx: (meta: Omit<BitstreamWifiRxMeta, "atMs">) => void;
  setWifiSync: (next: Partial<BitstreamWifiSyncMeta>) => void;
  reset: () => void;
}

export type BitstreamWifiStore = BitstreamWifiStateSlice & BitstreamWifiActions;

const initial: BitstreamWifiStateSlice = {
  lastStatus: null,
  lastStatusSource: null,
  lastScanComplete: null,
  autoConnectEnabled: null,
  lastUpdatedAt: null,
  lastTx: null,
  lastRx: null,
  wifiSync: {
    state: "idle",
    lastAttemptAtMs: null,
    lastOkAtMs: null,
    lastError: null,
  },
};

export const useBitstreamWifiStore = create<BitstreamWifiStore>((set) => ({
  ...initial,
  applyStatus: (payload, source) =>
    set({
      lastStatus: payload,
      lastStatusSource: source,
      lastUpdatedAt: Date.now(),
    }),
  applyScanComplete: (payload) =>
    set({
      lastScanComplete: payload,
      lastUpdatedAt: Date.now(),
    }),
  applyPolicy: (autoConnectEnabled) =>
    set({
      autoConnectEnabled,
      lastUpdatedAt: Date.now(),
    }),
  applyTx: (meta) =>
    set({
      lastTx: { ...meta, atMs: Date.now() },
    }),
  applyRx: (meta) =>
    set({
      lastRx: { ...meta, atMs: Date.now() },
    }),
  setWifiSync: (next) =>
    set((state) => ({
      wifiSync: {
        ...state.wifiSync,
        ...next,
      },
    })),
  reset: () => set(initial),
}));
