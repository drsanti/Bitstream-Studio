/*******************************************************************************
 * File Name : useBs2ControlReady.ts
 *
 * Description : BS2 control-plane readiness for Bitstream app actions.
 *               UART requires broker WS + COM open; simulator requires broker WS.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useMemo } from "react";
import { useWsClientStore } from "../../ws-client-store.js";
import { useBitstreamConnectionStore } from "../state/bitstreamConnection.store.js";
import { useBitstreamTelemetrySourceStore } from "../state/bitstreamTelemetrySource.store.js";

export type Bs2ControlReadySnapshot = {
  ready: boolean;
  reason: "ok" | "ws_disconnected" | "com_closed";
};

/** True when BS2 control-plane can send/await REQ/RES. */
export function useBs2ControlReady(): Bs2ControlReadySnapshot {
  const wsConnected = useWsClientStore((s) => s.isConnected);
  const serialStatus = useBitstreamConnectionStore((s) => s.serialBridgeStatus);
  const effectiveBackend = useBitstreamTelemetrySourceStore((s) => s.getEffectiveBackend());

  return useMemo(() => {
    if (!wsConnected)
    {
      return { ready: false, reason: "ws_disconnected" as const };
    }

    if (effectiveBackend === "uart")
    {
      if (serialStatus?.isOpen !== true)
      {
        return { ready: false, reason: "com_closed" as const };
      }
    }

    return { ready: true, reason: "ok" as const };
  }, [effectiveBackend, serialStatus?.isOpen, wsConnected]);
}

