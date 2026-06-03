/*******************************************************************************
 * File Name        : useWifiScanSession.ts
 *
 * Description      : UI scan session (holds active state until SCAN_DONE or timeout).
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.0
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useEffect, useRef, useState } from "react";
import { useBitstreamWifiStore } from "../../state/bitstreamWifi.store";
import { createWifiActivityEvent, type WifiActivityEvent } from "./wifi-activity-events";
import { WIFI_SCAN_UI_TIMEOUT_MS } from "./wifi-panel-utils";

export type WifiScanUiOutcome = "idle" | "active" | "timeout" | "complete";

export function useWifiScanSession(pushActivity: (evt: WifiActivityEvent) => void) {
  const [isScanActive, setIsScanActive] = useState(false);
  const [scanOutcome, setScanOutcome] = useState<WifiScanUiOutcome>("idle");
  const pendingReqIdRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScanComplete = useBitstreamWifiStore((s) => s.lastScanComplete);

  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const finishSession = useCallback(
    (outcome: "timeout" | "complete", totalCount: number) => {
      clearTimeoutRef();
      pendingReqIdRef.current = null;
      setIsScanActive(false);
      setScanOutcome(outcome);

      if (outcome === "timeout") {
        pushActivity(
          createWifiActivityEvent(
            "Scan",
            "warn",
            "No results (timeout 10 s)",
            "Device did not finish the scan in time",
          ),
        );
        return;
      }

      const n = totalCount;
      pushActivity(
        createWifiActivityEvent(
          "Scan",
          n > 0 ? "ok" : "idle",
          n > 0 ? `Found ${n} network${n === 1 ? "" : "s"}` : "No networks found",
          n > 0 ? "Sorted by signal strength" : "Scan completed with an empty list",
        ),
      );
    },
    [clearTimeoutRef, pushActivity],
  );

  const startScanSession = useCallback(
    (reqId: number) => {
      clearTimeoutRef();
      pendingReqIdRef.current = reqId;
      setIsScanActive(true);
      setScanOutcome("active");

      timeoutRef.current = setTimeout(() => {
        const rows = useBitstreamWifiStore.getState().scanRows.length;
        finishSession("timeout", rows);
      }, WIFI_SCAN_UI_TIMEOUT_MS);
    },
    [clearTimeoutRef, finishSession],
  );

  useEffect(() => {
    if (!isScanActive || lastScanComplete == null) {
      return;
    }
    const pending = pendingReqIdRef.current;
    if (pending != null && lastScanComplete.reqId !== pending) {
      return;
    }
    finishSession("complete", lastScanComplete.totalCount);
  }, [finishSession, isScanActive, lastScanComplete]);

  useEffect(() => {
    return () => {
      clearTimeoutRef();
    };
  }, [clearTimeoutRef]);

  return {
    isScanActive,
    scanOutcome,
    startScanSession,
  };
}
