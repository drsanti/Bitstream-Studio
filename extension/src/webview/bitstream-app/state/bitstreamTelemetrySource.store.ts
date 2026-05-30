/*******************************************************************************
 * File Name : bitstreamTelemetrySource.store.ts
 *
 * Description : Telemetry Source (Bitstream firmware / external Simulator) and route side effects.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { create } from "zustand";
import type { Bitstream2HelloPayload } from "../../../bitstream2/bridge/protocol";
import {
  releaseComIfEnteringSimulatorRoute,
  shouldRequestUartFullBringUp,
} from "../bridge/telemetryRouteComPolicy.js";
import {
  publishDevSimStreamingControl,
  publishDevSimStreamingIdle,
} from "../bridge/publishDevSimStreamingControl.js";
import {
  type BitstreamTelemetryBackend,
  type BitstreamTelemetryEffectiveBackend,
  resolveEffectiveTelemetryBackend,
} from "./bitstreamTelemetryBackend.js";
import { useBitstreamLiveStore } from "./bitstreamLive.store.js";

export type { BitstreamTelemetryBackend, BitstreamTelemetryEffectiveBackend };
export {
  BITSTREAM_FIRMWARE_ACTIVITY_LOG_PREFIX,
  BITSTREAM_TELEMETRY_SOURCE_LABELS,
  resolveEffectiveTelemetryBackend,
  telemetrySourceDisplayLabel,
} from "./bitstreamTelemetryBackend.js";

const STORAGE_KEY = "bitstream.telemetry.backend";

function persistBackend(backend: BitstreamTelemetryBackend): void {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, backend);
  } catch {
    // ignore
  }
}

function loadPersistedBackend(): BitstreamTelemetryBackend {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return "uart";
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "auto") {
      persistBackend("uart");
      return "uart";
    }
    if (raw === "uart" || raw === "simulator") {
      return raw;
    }
  } catch {
    // ignore
  }
  return "uart";
}

function applyTelemetryRouteChange(args: {
  prevBackend: BitstreamTelemetryBackend;
  nextBackend: BitstreamTelemetryBackend;
}): { uartBringUpPending: boolean } {
  releaseComIfEnteringSimulatorRoute(args);
  const uartBringUpPending = shouldRequestUartFullBringUp(args);
  return { uartBringUpPending };
}

type BitstreamTelemetrySourceState = {
  backend: BitstreamTelemetryBackend;
  loopbackAvailable: boolean;
  bs2Hello: Bitstream2HelloPayload | null;
  /** Monotonic token — increments each time SOURCE enters explicit Simulator. */
  simulatorSourceSwitchSeq: number;
  /** Wall clock when the latest explicit Simulator switch started (after live reset). */
  simulatorWatchStartedAtMs: number | null;
  /** Monotonic token — increments each time SOURCE enters Bitstream (firmware). */
  uartSourceSwitchSeq: number;
  /** Wall clock when the latest explicit UART switch started. */
  uartWatchStartedAtMs: number | null;
  /** After Simulator→UART (etc.): run list → open → PING even if COM appears open. */
  uartBringUpPending: boolean;
  /** USB unplugged — wait for COM enumeration before uartBringUpPending. */
  uartAwaitingReplug: boolean;
  setBackend: (backend: BitstreamTelemetryBackend) => void;
  setLoopbackAvailable: (enabled: boolean) => void;
  setBs2Hello: (hello: Bitstream2HelloPayload | null) => void;
  consumeUartBringUpPending: () => boolean;
  /** COM dropped while on Bitstream source — clear handshake; require full bring-up on reopen. */
  notifyUartSerialLinkLost: () => void;
  /** COM available again after hotplug — queue full bring-up (debounced caller). */
  requestUartBringUpAfterHotplug: () => void;
  /** Start missing-notice grace window (page load with persisted Simulator or re-arm). */
  armSimulatorMissingNoticeWatch: () => void;
  /** Start UART handshake-notice grace window (page load with persisted UART or re-arm). */
  armUartMissingHandshakeWatch: () => void;
  getEffectiveBackend: () => BitstreamTelemetryEffectiveBackend;
};

function armSimulatorMissingNoticeWatchState(
  set: (
    partial:
      | Partial<BitstreamTelemetrySourceState>
      | ((state: BitstreamTelemetrySourceState) => Partial<BitstreamTelemetrySourceState>),
  ) => void,
  get: () => BitstreamTelemetrySourceState,
): void {
  set({
    simulatorWatchStartedAtMs: Date.now(),
    simulatorSourceSwitchSeq: get().simulatorSourceSwitchSeq + 1,
  });
}

function armUartMissingHandshakeWatchState(
  set: (
    partial:
      | Partial<BitstreamTelemetrySourceState>
      | ((state: BitstreamTelemetrySourceState) => Partial<BitstreamTelemetrySourceState>),
  ) => void,
  get: () => BitstreamTelemetrySourceState,
): void {
  set({
    uartWatchStartedAtMs: Date.now(),
    uartSourceSwitchSeq: get().uartSourceSwitchSeq + 1,
  });
}

export const useBitstreamTelemetrySourceStore = create<BitstreamTelemetrySourceState>(
  (set, get) => ({
    backend: loadPersistedBackend(),
    loopbackAvailable: false,
    bs2Hello: null,
    simulatorSourceSwitchSeq: 0,
    simulatorWatchStartedAtMs: null,
    uartSourceSwitchSeq: 0,
    uartWatchStartedAtMs: null,
    uartBringUpPending: false,
    uartAwaitingReplug: false,
    setBackend: (backend) => {
      const prevBackend = get().backend;
      persistBackend(backend);
      const route = applyTelemetryRouteChange({
        prevBackend,
        nextBackend: backend,
      });
      set({
        backend,
        ...(backend === "simulator" ? { loopbackAvailable: true } : {}),
        uartBringUpPending: get().uartBringUpPending || route.uartBringUpPending,
      });
      if (prevBackend !== backend) {
        useBitstreamLiveStore.getState().resetLiveData();
        if (backend === "simulator") {
          set({ bs2Hello: null, uartWatchStartedAtMs: null });
          armSimulatorMissingNoticeWatchState(set, get);
          publishDevSimStreamingControl();
        }
        else {
          set({ bs2Hello: null, simulatorWatchStartedAtMs: null });
          armUartMissingHandshakeWatchState(set, get);
          publishDevSimStreamingIdle();
        }
      }
    },
    setLoopbackAvailable: (loopbackAvailable) => {
      set({ loopbackAvailable });
      if (loopbackAvailable && get().backend === "simulator") {
        publishDevSimStreamingControl();
      }
    },
    setBs2Hello: (bs2Hello) => set({ bs2Hello }),
    consumeUartBringUpPending: () => {
      const pending = get().uartBringUpPending;
      if (pending) {
        set({ uartBringUpPending: false });
      }
      return pending;
    },
    notifyUartSerialLinkLost: () => {
      if (get().backend !== "uart") {
        return;
      }
      useBitstreamLiveStore.getState().setHandshakeState("unknown");
      useBitstreamLiveStore.getState().setHandshakeLastError(null);
      /* Do not set uartBringUpPending here — COM is gone; poller queues bring-up when a port returns. */
      set({ bs2Hello: null, uartAwaitingReplug: true, uartBringUpPending: false });
    },
    requestUartBringUpAfterHotplug: () => {
      if (get().backend !== "uart") {
        return;
      }
      set({ uartBringUpPending: true, uartAwaitingReplug: false });
    },
    armSimulatorMissingNoticeWatch: () => {
      if (get().backend !== "simulator") {
        return;
      }
      armSimulatorMissingNoticeWatchState(set, get);
    },
    armUartMissingHandshakeWatch: () => {
      if (get().backend !== "uart") {
        return;
      }
      armUartMissingHandshakeWatchState(set, get);
    },
    getEffectiveBackend: () => resolveEffectiveTelemetryBackend(get().backend),
  }),
);
