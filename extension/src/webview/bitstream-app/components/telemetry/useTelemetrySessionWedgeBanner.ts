import { useEffect, useRef, useState } from "react";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import { useBitstreamConnectionStore } from "../../state/bitstreamConnection.store.js";
import { useBitstreamDeviceSensorConfigStore } from "../../state/bitstreamDeviceSensorConfig.store.js";
import { useBitstreamLiveStore } from "../../state/bitstreamLive.store.js";
import { isTelemetryTransportReady } from "../../utils/bitstreamTelemetryTransport.js";
import { computeSensorDecodeStaleRecoverLikely } from "./sensorDecodeStaleWatchdog.js";

/** Require the stale pattern to hold this long before showing the banner (avoids flapping). */
const STALE_BANNER_DEBOUNCE_MS = 400;

/**
 * Debounced “session may be wedged” signal for **Telemetry diagnostics** only.
 */
export function useTelemetrySessionWedgeBanner(): boolean {
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const lastAtByHint = useBitstreamLiveStore((s) => s.lastAtByHint);
  const sampleCount = useBitstreamLiveStore((s) => s.sampleCount);
  const [showBanner, setShowBanner] = useState(false);
  const staleSinceMsRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const nowMs = Date.now();
      const live = useBitstreamLiveStore.getState();
      const bySourceIdNow = useBitstreamDeviceSensorConfigStore.getState().bySourceId;
      const mult = useBitstreamConfigStore.getState().sensorDecodeStaleIntervalMultiplier;
      const conn = useBitstreamConnectionStore.getState();
      const transportReady = isTelemetryTransportReady(conn);

      const likely = computeSensorDecodeStaleRecoverLikely({
        transportReady,
        handshakeState: live.handshakeState,
        sampleCount: live.sampleCount,
        lastAtByHint: live.lastAtByHint,
        nowMs,
        bySourceId: bySourceIdNow,
        multiplier: mult,
      });

      if (!likely) {
        staleSinceMsRef.current = null;
        setShowBanner(false);
        return;
      }
      if (staleSinceMsRef.current == null) {
        staleSinceMsRef.current = nowMs;
      }
      setShowBanner(nowMs - staleSinceMsRef.current >= STALE_BANNER_DEBOUNCE_MS);
    };

    const id = window.setInterval(tick, 200);
    tick();
    return () => window.clearInterval(id);
  }, [handshakeState, lastAtByHint, sampleCount]);

  return showBanner;
}
