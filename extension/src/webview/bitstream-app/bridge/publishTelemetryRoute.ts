/*******************************************************************************
 * File Name : publishTelemetryRoute.ts
 *
 * Description : Publish authoritative telemetry route (Bitstream vs Simulator) to the bridge.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import {
  BITSTREAM2_TOPICS,
  type Bitstream2TelemetryRouteMode,
} from "../../../bitstream2/bridge/protocol";
import { useWsClientStore } from "../../ws-client-store";

function publishTelemetryRouteOnce(mode: Bitstream2TelemetryRouteMode): void {
  const client = useWsClientStore.getState();
  if (!client.isConnected)
  {
    return;
  }
  void client.publish(
    BITSTREAM2_TOPICS.TELEMETRY_ROUTE,
    { mode, atMs: Date.now() },
    0,
  );
}

/**
 * Tell the serial bridge which telemetry backend is active (last writer wins on broker).
 * Re-publishes once after a short delay so a reconnecting bridge does not miss the route.
 */
export function publishTelemetryRoute(mode: Bitstream2TelemetryRouteMode): void {
  publishTelemetryRouteOnce(mode);
  if (typeof window === "undefined")
  {
    return;
  }
  window.setTimeout(() => publishTelemetryRouteOnce(mode), 450);
}
