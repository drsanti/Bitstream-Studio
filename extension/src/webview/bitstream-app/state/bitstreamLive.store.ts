import { create } from "zustand";
import type { BitstreamSensorSampleV2, BitstreamSensorSourceHint } from "../../../bitstream/index";
import { BMI270_MASK } from "../../../bitstream2/domains/sensors/bmi270.js";
import { emptyStreamHzByHint, type StreamHzByHint } from "../utils/telemetryStreamRate.js";

/** Derived from every `onSensorSample(bmi270)` before UI throttle; snapshot updated each flush. */
export interface Bmi270WireReceiveDiag {
  /** Mean interval between consecutive BMI270 packets in the renderer (ms). */
  meanGapMs: number | null;
  /** Std dev of recent inter-arrival gaps (ms). */
  jitterStdMs: number | null;
  /** Estimated wire rate from recent gaps (Hz). */
  wireHzFromGaps: number | null;
  /** BMI270 packets received since last UI flush (if often >1, host is coalescing frames). */
  samplesCoalescedLastFlush: number;
}

export interface MetricsSnapshot {
  eventCount: number;
  sampleCount: number;
  /**
   * Lifetime count of **sensor channel (`0x01`)** frames whose payload did not decode to
   * `BitstreamSensorSampleV2` (`decodeBitstreamEvent` → `UNKNOWN`). Rises with protocol
   * mismatch, corrupt payloads, or desync while BRx may still increase.
   */
  sensorChannelDecodeRejectCount: number;
  /**
   * When **Telemetry decode debug** is enabled: inbound Bitstream frames counted by **wire channel**
   * for the current UART session (clears on telemetry reset / disconnect).
   */
  telemetryDebugInboundFramesByChannel?: Record<number, number>;
  /** Last transport disconnect reason from the serial bridge adapter (when reported). */
  telemetryDebugLastTransportDisconnectReason?: string | null;
  diagFrameCount: number;
  diagAckCount: number;
  latestByHint: Record<BitstreamSensorSourceHint, BitstreamSensorSampleV2 | null>;
  lastAtByHint: Record<BitstreamSensorSourceHint, number | null>;
  /** Device tMs inter-arrival (BS2 EVT_SENSOR publish spacing). */
  lastDeltaMsByHint: Record<BitstreamSensorSourceHint, number | null>;
  /** Host wall-clock gap between consecutive ingested samples (actual receive rate). */
  lastHostInterArrivalMsByHint: Record<BitstreamSensorSourceHint, number | null>;
  /** EMA stream rate from device tMs inter-arrival (Hz). */
  streamHzDeviceByHint: StreamHzByHint;
  /** EMA stream rate from host ingest gaps (Hz). */
  streamHzHostByHint: StreamHzByHint;
  /** EMA stream rate from sample-counter slope vs host gap (Hz). */
  streamHzCounterByHint: StreamHzByHint;
  /** EMA stream rate from rolling mean of recent host gaps (Hz). */
  streamHzSmoothedByHint: StreamHzByHint;
  frameCountByHint: Record<BitstreamSensorSourceHint, number>;
  bmi270WireDiag: Bmi270WireReceiveDiag | null;
}

export interface HandshakeSummary {
  protocolVersion: number;
  capsFlags: number;
  statusCounter: number;
  totalDurationMs: number;
}

export type HandshakeLifecycleState = "unknown" | "running" | "passed" | "failed";
export type FirmwareLivenessState = "unknown" | "alive" | "stale" | "dead";

interface BitstreamLiveState extends MetricsSnapshot {
  /** BS2 ingest: count of EVT_SENSOR JSON messages accepted (after transport gating). */
  bs2EvtSensorRxCount: number;
  /** BS2 ingest: last wall-clock time we accepted an EVT_SENSOR message (ms since epoch). */
  bs2EvtSensorLastRxAtMs: number | null;
  /** Last BMI270 EVT_SENSOR mask byte (0x07 = raw only on wire; fusion adds 0x08/0x10). */
  bmi270LastEvtMask: number | null;
  /** OR of all BMI270 EVT mask bytes seen this session (stable; use for TMP presence, not last frame). */
  bmi270EvtMaskSeenOr: number;
  /** UI flush: count of metrics snapshots applied to the live store. */
  uiFlushCount: number;
  /** UI flush: last wall-clock time a snapshot was applied (ms since epoch). */
  uiFlushLastAtMs: number | null;
  lastDiagFrameHex: string;
  diagStreaming: boolean;
  diagBusy: boolean;
  diagLastResult: string;
  handshake: HandshakeSummary | null;
  handshakeState: HandshakeLifecycleState;
  handshakeLastError: string | null;
  handshakeAttempts: number;
  firmwareLiveness: FirmwareLivenessState;
  firmwareLastRxAtMs: number | null;
}

interface BitstreamLiveActions {
  applyMetricsSnapshot: (snapshot: MetricsSnapshot) => void;
  resetLiveData: () => void;
  bumpBs2EvtSensorRx: (atMs?: number) => void;
  recordBmi270EvtMask: (mask: number) => void;
  bumpUiFlushApplied: (atMs?: number) => void;
  setLastDiagFrameHex: (value: string) => void;
  setDiagStreaming: (value: boolean) => void;
  setDiagBusy: (value: boolean) => void;
  setDiagLastResult: (value: string) => void;
  setHandshake: (value: HandshakeSummary | null) => void;
  setHandshakeState: (value: HandshakeLifecycleState) => void;
  setHandshakeLastError: (value: string | null) => void;
  setHandshakeAttempts: (value: number) => void;
  incrementHandshakeAttempts: () => void;
  setFirmwareLiveness: (value: FirmwareLivenessState, lastRxAtMs?: number | null) => void;
  /** High-frequency RX path (BS2 samples): alive + lastRx, throttled to limit React churn. */
  touchFirmwareRxAt: (atMs?: number) => void;
}

/** Min gap between `firmwareLastRxAtMs`-only bumps while already `alive`. */
const FIRMWARE_RX_TOUCH_MIN_MS = 500;

export type BitstreamLiveStore = BitstreamLiveState & BitstreamLiveActions;

export function getInitialMetrics(): MetricsSnapshot {
  return {
    eventCount: 0,
    sampleCount: 0,
    sensorChannelDecodeRejectCount: 0,
    telemetryDebugInboundFramesByChannel: undefined,
    telemetryDebugLastTransportDisconnectReason: undefined,
    diagFrameCount: 0,
    diagAckCount: 0,
    bmi270WireDiag: null,
    latestByHint: {
      unknown: null,
      sht40: null,
      dps368: null,
      bmi270: null,
      bmm350: null,
    },
    lastAtByHint: {
      unknown: null,
      sht40: null,
      dps368: null,
      bmi270: null,
      bmm350: null,
    },
    lastDeltaMsByHint: {
      unknown: null,
      sht40: null,
      dps368: null,
      bmi270: null,
      bmm350: null,
    },
    lastHostInterArrivalMsByHint: {
      unknown: null,
      sht40: null,
      dps368: null,
      bmi270: null,
      bmm350: null,
    },
    streamHzDeviceByHint: emptyStreamHzByHint(),
    streamHzHostByHint: emptyStreamHzByHint(),
    streamHzCounterByHint: emptyStreamHzByHint(),
    streamHzSmoothedByHint: emptyStreamHzByHint(),
    frameCountByHint: {
      unknown: 0,
      sht40: 0,
      dps368: 0,
      bmi270: 0,
      bmm350: 0,
    },
  };
}

const LIVE_DEFAULTS: Pick<
  BitstreamLiveState,
  | "lastDiagFrameHex"
  | "diagStreaming"
  | "diagBusy"
  | "diagLastResult"
  | "handshake"
  | "handshakeState"
  | "handshakeLastError"
  | "handshakeAttempts"
  | "firmwareLiveness"
  | "firmwareLastRxAtMs"
  | "bs2EvtSensorRxCount"
  | "bs2EvtSensorLastRxAtMs"
  | "bmi270LastEvtMask"
  | "bmi270EvtMaskSeenOr"
  | "uiFlushCount"
  | "uiFlushLastAtMs"
> = {
  lastDiagFrameHex: "No diag frame yet",
  diagStreaming: false,
  diagBusy: false,
  diagLastResult: "No command yet",
  handshake: null,
  handshakeState: "unknown",
  handshakeLastError: null,
  handshakeAttempts: 0,
  firmwareLiveness: "unknown",
  firmwareLastRxAtMs: null,
  bs2EvtSensorRxCount: 0,
  bs2EvtSensorLastRxAtMs: null,
  bmi270LastEvtMask: null,
  bmi270EvtMaskSeenOr: 0,
  uiFlushCount: 0,
  uiFlushLastAtMs: null,
};

/** Human-readable summary of the last BMI270 EVT mask for fusion troubleshooting. */
export function describeBmi270EvtMask(mask: number | null): string
{
  if (mask == null)
  {
    return "no BMI270 EVT yet";
  }
  const parts: string[] = [`0x${(mask & 0xff).toString(16).padStart(2, "0")}`];
  if ((mask & BMI270_MASK.EULER) === 0 && (mask & BMI270_MASK.QUAT) === 0)
  {
    if (mask === (BMI270_MASK.ACC | BMI270_MASK.GYR))
    {
      parts.push("accel+gyro only (no temp, no Euler/Quat)");
    }
    else if ((mask & (BMI270_MASK.ACC | BMI270_MASK.GYR | BMI270_MASK.TMP)) !== 0)
    {
      parts.push("raw IMU only (no Euler/Quat on wire)");
    }
    else
    {
      parts.push("no Euler/Quat on wire");
    }
  }
  else
  {
    if ((mask & BMI270_MASK.EULER) !== 0)
    {
      parts.push("Euler");
    }
    if ((mask & BMI270_MASK.QUAT) !== 0)
    {
      parts.push("Quat");
    }
  }
  return parts.join(" — ");
}

export const useBitstreamLiveStore = create<BitstreamLiveStore>((set) => ({
  ...getInitialMetrics(),
  ...LIVE_DEFAULTS,

  applyMetricsSnapshot: (snapshot) =>
    set((state) => ({
      ...snapshot,
      bs2EvtSensorRxCount: state.bs2EvtSensorRxCount,
      bs2EvtSensorLastRxAtMs: state.bs2EvtSensorLastRxAtMs,
      bmi270LastEvtMask: state.bmi270LastEvtMask,
      bmi270EvtMaskSeenOr: state.bmi270EvtMaskSeenOr,
      uiFlushCount: state.uiFlushCount,
      uiFlushLastAtMs: state.uiFlushLastAtMs,
    })),
  resetLiveData: () => set({ ...getInitialMetrics(), ...LIVE_DEFAULTS }),
  bumpBs2EvtSensorRx: (atMs) =>
    set((state) => ({
      bs2EvtSensorRxCount: state.bs2EvtSensorRxCount + 1,
      bs2EvtSensorLastRxAtMs: atMs ?? Date.now(),
    })),
  recordBmi270EvtMask: (mask) =>
    set((state) => {
      const masked = mask & 0xff;
      return {
        bmi270LastEvtMask: masked,
        bmi270EvtMaskSeenOr: state.bmi270EvtMaskSeenOr | masked,
      };
    }),
  bumpUiFlushApplied: (atMs) =>
    set((state) => ({
      uiFlushCount: state.uiFlushCount + 1,
      uiFlushLastAtMs: atMs ?? Date.now(),
    })),
  setLastDiagFrameHex: (value) => set({ lastDiagFrameHex: value }),
  setDiagStreaming: (value) => set({ diagStreaming: value }),
  setDiagBusy: (value) => set({ diagBusy: value }),
  setDiagLastResult: (value) => set({ diagLastResult: value }),
  setHandshake: (value) => set({ handshake: value }),
  setHandshakeState: (value) => set({ handshakeState: value }),
  setHandshakeLastError: (value) => set({ handshakeLastError: value }),
  setHandshakeAttempts: (value) => set({ handshakeAttempts: value }),
  incrementHandshakeAttempts: () => set((state) => ({ handshakeAttempts: state.handshakeAttempts + 1 })),
  setFirmwareLiveness: (value, lastRxAtMs) =>
    set((state) => {
      const nextLastRx = lastRxAtMs ?? null;
      if (
        state.firmwareLiveness === value &&
        state.firmwareLastRxAtMs === nextLastRx
      ) {
        return state;
      }
      if (
        state.firmwareLiveness === value &&
        nextLastRx != null &&
        state.firmwareLastRxAtMs != null &&
        Math.abs(nextLastRx - state.firmwareLastRxAtMs) < 50
      ) {
        return state;
      }
      return {
        firmwareLiveness: value,
        firmwareLastRxAtMs: nextLastRx,
      };
    }),
  touchFirmwareRxAt: (atMs) =>
    set((state) => {
      const t = atMs ?? Date.now();
      if (state.firmwareLiveness === "alive") {
        const prev = state.firmwareLastRxAtMs;
        if (prev != null && t - prev < FIRMWARE_RX_TOUCH_MIN_MS) {
          return state;
        }
      }
      if (state.firmwareLiveness === "alive" && state.firmwareLastRxAtMs === t) {
        return state;
      }
      return {
        firmwareLiveness: "alive",
        firmwareLastRxAtMs: t,
      };
    }),
}));
