import { useEffect, useMemo, useState } from "react";
import { useBitstreamConnectionStore } from "../../bitstream-app/state/bitstreamConnection.store";
import { useBitstreamLiveStore } from "../../bitstream-app/state/bitstreamLive.store";
import { useWsClientStore } from "../../ws-client-store";
import {
  usePresentationBmi270,
  usePresentationBmm350,
  usePresentationDps368,
  usePresentationSht40,
} from "../shared/live";
import type { DiagramLiveSnapshot } from "./diagram/diagramBindingCatalog";
import {
  courseLinkHealthTickMs,
  isCourseLinkHealthy,
  resolveCourseLastRxAtMs,
} from "./courseTelemetryFreshness";

export function useCourseTelemetryLinkState(staleMs?: number) {
  const bmi270 = usePresentationBmi270();
  const bmm350 = usePresentationBmm350();
  const sht40 = usePresentationSht40();
  const dps368 = usePresentationDps368();
  const connected = useBitstreamConnectionStore((s) => s.connected);
  const wsConnected = useWsClientStore((s) => s.isConnected);
  const bs2EvtSensorLastRxAtMs = useBitstreamLiveStore((s) => s.bs2EvtSensorLastRxAtMs);
  const firmwareLastRxAtMs = useBitstreamLiveStore((s) => s.firmwareLastRxAtMs);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const tickMs = courseLinkHealthTickMs(staleMs);

  useEffect(() => {
    if (tickMs == null) {
      return;
    }
    const id = window.setInterval(() => setNowMs(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);

  const transportUp = connected && wsConnected;
  const lastRxAtMs = resolveCourseLastRxAtMs(bs2EvtSensorLastRxAtMs, firmwareLastRxAtMs);

  const snapshot = useMemo<DiagramLiveSnapshot>(
    () => ({
      bmi270,
      bmm350,
      sht40,
      dps368,
      connected: transportUp,
    }),
    [bmi270, bmm350, sht40, dps368, transportUp],
  );

  const healthy = isCourseLinkHealthy({
    snapshot,
    nowMs,
    lastRxAtMs,
    staleMs,
  });

  return {
    snapshot,
    healthy,
    transportUp,
    lastRxAtMs,
    nowMs,
  };
}
