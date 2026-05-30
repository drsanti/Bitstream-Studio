/*******************************************************************************
 * File Name : useSimulatorTelemetryMissingAlert.ts
 *
 * Description : After explicit Simulator source switch, show TRNFloatingNotice when
 *               no EVT_SENSOR arrives within the grace window. Also arms on page load
 *               when Simulator is persisted in localStorage.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.2
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef, useState } from "react";
import { useBitstreamLiveStore } from "../../bitstream-app/state/bitstreamLive.store.js";
import { useBitstreamTelemetrySourceStore } from "../../bitstream-app/state/bitstreamTelemetrySource.store.js";
import { useWsClientStore } from "../../ws-client-store.js";
import {
  hasEvtSensorSinceSimulatorSwitch,
  SIMULATOR_MISSING_EVT_SENSOR_GRACE_MS,
} from "../utils/simulatorTelemetryMissingAlert.js";

export type SimulatorTelemetryMissingAlertState = {
  open: boolean;
  wsConnected: boolean;
  /** Remount TRNFloatingNotice on each explicit Simulator switch. */
  noticeKey: number;
  onOpenChange: (open: boolean) => void;
};

/**
 * Watches telemetry source + BS2 ingest; exposes notice open state for {@link SimulatorNotRunningNotice}.
 */
export function useSimulatorTelemetryMissingAlert(): SimulatorTelemetryMissingAlertState {
  const backend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const simulatorSourceSwitchSeq = useBitstreamTelemetrySourceStore(
    (s) => s.simulatorSourceSwitchSeq,
  );
  const simulatorWatchStartedAtMs = useBitstreamTelemetrySourceStore(
    (s) => s.simulatorWatchStartedAtMs,
  );
  const evtSensorRxCount = useBitstreamLiveStore((s) => s.bs2EvtSensorRxCount);
  const lastEvtSensorRxAtMs = useBitstreamLiveStore((s) => s.bs2EvtSensorLastRxAtMs);
  const wsConnected = useWsClientStore((s) => s.isConnected);
  const armSimulatorWatch = useBitstreamTelemetrySourceStore(
    (s) => s.armSimulatorMissingNoticeWatch,
  );

  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const evtCountBaselineRef = useRef(0);
  const activeSwitchSeqRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  /* --- Block: page refresh with persisted Simulator (no setBackend call) --- */
  useEffect(() => {
    if (backend !== "simulator" || simulatorWatchStartedAtMs != null) {
      return;
    }
    armSimulatorWatch();
  }, [backend, simulatorWatchStartedAtMs, armSimulatorWatch]);

  /* --- Block: start grace timer on each explicit Simulator switch --- */
  useEffect(() => {
    if (backend !== "simulator" || simulatorWatchStartedAtMs == null) {
      clearTimer();
      activeSwitchSeqRef.current = 0;
      setOpen(false);
      return;
    }

    activeSwitchSeqRef.current = simulatorSourceSwitchSeq;
    evtCountBaselineRef.current = useBitstreamLiveStore.getState().bs2EvtSensorRxCount;
    setOpen(false);
    clearTimer();

    const watchAt = simulatorWatchStartedAtMs;
    const switchSeq = simulatorSourceSwitchSeq;

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (activeSwitchSeqRef.current !== switchSeq) {
        return;
      }
      if (useBitstreamTelemetrySourceStore.getState().backend !== "simulator") {
        return;
      }
      const live = useBitstreamLiveStore.getState();
      const hasRxSinceSwitch =
        live.bs2EvtSensorRxCount > evtCountBaselineRef.current ||
        hasEvtSensorSinceSimulatorSwitch({
          watchStartedAtMs: watchAt,
          lastEvtSensorRxAtMs: live.bs2EvtSensorLastRxAtMs,
        });
      if (hasRxSinceSwitch) {
        return;
      }
      setOpen(true);
    }, SIMULATOR_MISSING_EVT_SENSOR_GRACE_MS);

    return clearTimer;
  }, [backend, simulatorSourceSwitchSeq, simulatorWatchStartedAtMs]);

  /* --- Block: cancel when EVT_SENSOR arrives for this switch --- */
  useEffect(() => {
    if (backend !== "simulator" || simulatorWatchStartedAtMs == null) {
      return;
    }
    if (activeSwitchSeqRef.current !== simulatorSourceSwitchSeq) {
      return;
    }
    const hasRxSinceSwitch =
      evtSensorRxCount > evtCountBaselineRef.current ||
      hasEvtSensorSinceSimulatorSwitch({
        watchStartedAtMs: simulatorWatchStartedAtMs,
        lastEvtSensorRxAtMs,
      });
    if (hasRxSinceSwitch) {
      clearTimer();
      setOpen(false);
    }
  }, [
    backend,
    simulatorSourceSwitchSeq,
    simulatorWatchStartedAtMs,
    evtSensorRxCount,
    lastEvtSensorRxAtMs,
  ]);

  useEffect(() => () => clearTimer(), []);

  return {
    open,
    wsConnected,
    noticeKey: simulatorSourceSwitchSeq,
    onOpenChange: setOpen,
  };
}
