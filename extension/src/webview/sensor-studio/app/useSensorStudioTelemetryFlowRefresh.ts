import { useEffect, useRef } from "react";
import { useBitstreamConnectionStore } from "../../bitstream-app/state/bitstreamConnection.store";
import { useBitstreamLiveStore } from "../../bitstream-app/state/bitstreamLive.store";
import { isTelemetryTransportReady } from "../../bitstream-app/utils/bitstreamTelemetryTransport";

/** Align with LastUpdateBadge / stale watchdog poll cadence. */
const STALE_FLOW_REFRESH_POLL_MS = 250;

/**
 * Sensor Studio flow graph ticks are normally driven by `sampleCount` (and BMI270 wire taps).
 * When decode stalls, `sampleCount` stops and gauges/health freeze. This interval re-runs the
 * flow only while samples are not advancing so health badges and hold-last-value nodes refresh.
 */
export function useSensorStudioTelemetryFlowRefresh(tickSimulation: () => void): void {
  const tickRef = useRef(tickSimulation);
  tickRef.current = tickSimulation;
  const prevSampleCountRef = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
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
        tickRef.current();
      }
    }, STALE_FLOW_REFRESH_POLL_MS);
    return () => window.clearInterval(id);
  }, []);
}
