import { create } from "zustand";
import type {
  BitstreamWifiScanCompletePayload,
  BitstreamWifiScanRow,
  BitstreamWifiStatusPayload,
  BitstreamWifiStatusSource,
  BitstreamWifiTxKind,
} from "../../../bitstream2/domains/wifi/store-types";

export type {
  BitstreamWifiScanCompletePayload,
  BitstreamWifiScanRow,
  BitstreamWifiStatusPayload,
  BitstreamWifiStatusSource,
  BitstreamWifiTxKind,
};

export type BitstreamWifiTxMeta = {
  kind: BitstreamWifiTxKind;
  reqId: number;
  atMs: number;
};

export type BitstreamWifiRxMeta = {
  kind: number;
  reqId: number;
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
  scanRows: BitstreamWifiScanRow[];
  lastScanComplete: BitstreamWifiScanCompletePayload | null;
  autoConnectEnabled: boolean | null;
  lastUpdatedAt: number | null;
  lastTx: BitstreamWifiTxMeta | null;
  lastRx: BitstreamWifiRxMeta | null;
  wifiSync: BitstreamWifiSyncMeta;
}

interface BitstreamWifiActions {
  applyStatus: (payload: BitstreamWifiStatusPayload, source: BitstreamWifiStatusSource) => void;
  appendScanRow: (row: BitstreamWifiScanRow) => void;
  clearScanRows: () => void;
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
  scanRows: [],
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
  appendScanRow: (row) =>
    set((state) => ({
      scanRows: [...state.scanRows.filter((r) => r.index !== row.index), row].sort(
        (a, b) => a.index - b.index,
      ),
      lastUpdatedAt: Date.now(),
    })),
  clearScanRows: () =>
    set({
      scanRows: [],
      lastScanComplete: null,
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
