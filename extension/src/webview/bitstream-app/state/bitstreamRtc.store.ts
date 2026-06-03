import { create } from "zustand";
import type { BitstreamRtcStatusPayload } from "../../../bitstream2/domains/time/store-types";
import { BS2_RTC_FLAG_VALID } from "../../../bitstream2/domains/time/commands";

export type { BitstreamRtcStatusPayload };

export type BitstreamRtcTxKind = "time_set" | "time_get" | "time_sync";

export type BitstreamRtcTxMeta = {
  kind: BitstreamRtcTxKind;
  reqId: number;
  atMs: number;
};

interface BitstreamRtcStateSlice {
  lastStatus: BitstreamRtcStatusPayload | null;
  lastUpdatedAt: number | null;
  lastTx: BitstreamRtcTxMeta | null;
}

interface BitstreamRtcActions {
  applyStatus: (payload: BitstreamRtcStatusPayload) => void;
  applyTx: (meta: Omit<BitstreamRtcTxMeta, "atMs">) => void;
  reset: () => void;
}

export type BitstreamRtcStore = BitstreamRtcStateSlice & BitstreamRtcActions;

const initial: BitstreamRtcStateSlice = {
  lastStatus: null,
  lastUpdatedAt: null,
  lastTx: null,
};

export const useBitstreamRtcStore = create<BitstreamRtcStore>((set) => ({
  ...initial,
  applyStatus: (payload) =>
  {
    set({ lastStatus: payload, lastUpdatedAt: Date.now() });
  },
  applyTx: (meta) =>
  {
    set({ lastTx: { ...meta, atMs: Date.now() } });
  },
  reset: () =>
  {
    set(initial);
  },
}));

/** True when firmware reports a valid wall clock. */
export function isRtcStatusValid(status: BitstreamRtcStatusPayload | null): boolean {
  return status !== null && (status.flags & BS2_RTC_FLAG_VALID) !== 0;
}
