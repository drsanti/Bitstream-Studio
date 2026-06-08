import { useEffect, useRef } from "react";
import { useBitstreamConnectionStore } from "../../bitstream-app/state/bitstreamConnection.store";
import { useBitstreamLiveStore } from "../../bitstream-app/state/bitstreamLive.store";
import { isTelemetryTransportReady } from "../../bitstream-app/utils/bitstreamTelemetryTransport";
import {
  minFrameIntervalMs,
  shouldRunCappedFrame,
} from "../persistence/sensor-studio-performance-preferences";
import { recordFlowSimulationTick } from "../core/runtime/sensor-studio-performance-telemetry";
import { useSensorStudioPerformanceStore } from "../state/sensor-studio-performance.store";

/** Align with LastUpdateBadge / stale watchdog poll cadence. */
const STALE_FLOW_REFRESH_POLL_MS = 250;

/**
 * Sensor Studio flow graph ticks are normally driven by `sampleCount` (and BMI270 wire taps).
 * When decode stalls, `sampleCount` stops and gauges/health freeze. This interval re-runs the
 * flow only while samples are not advancing so health badges and hold-last-value nodes refresh.
 */
export function useSensorStudioTelemetryFlowRefresh(tickSimulation: () => boolean): void {
  const tickRef = useRef(tickSimulation);
  tickRef.current = tickSimulation;
  const prevSampleCountRef = useRef(0);
  const lastStaleTickMsRef = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }
      const conn = useBitstreamConnectionStore.getState();
      const live = useBitstreamLiveStore.getState();
      const transportReady = isTelemetryTransportReady(conn);
      if (!transportReady || live.handshakeState !== "passed") {
        prevSampleCountRef.current = live.sampleCount;
        return;
      }
      const prev = prevSampleCountRef.current;
      prevSampleCountRef.current = live.sampleCount;
      if (live.sampleCount === prev) {
        const maxFps =
          useSensorStudioPerformanceStore.getState().preferences.flowSimulationMaxFps;
        const minIntervalMs = minFrameIntervalMs(maxFps);
        const nowMs = performance.now();
        if (!shouldRunCappedFrame(nowMs, lastStaleTickMsRef.current, minIntervalMs)) {
          return;
        }
        lastStaleTickMsRef.current = nowMs;
        const t0 = performance.now();
        tickRef.current();
        recordFlowSimulationTick(performance.now() - t0, t0);
      }
    }, STALE_FLOW_REFRESH_POLL_MS);
    return () => window.clearInterval(id);
  }, []);
}
