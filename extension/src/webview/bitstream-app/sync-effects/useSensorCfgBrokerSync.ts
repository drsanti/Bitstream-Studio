/*******************************************************************************
 * File Name : useSensorCfgBrokerSync.ts
 *
 * Description : Subscribe to serialport/sensor-cfg-updated and merge remote
 *               firmware-verified rows into draft + baseline.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect } from "react";
import {
  SERIALPORT_TOPICS,
  type SensorCfgUpdatedPayload,
} from "../../../serialport-bridge/protocol.js";
import { getSensorSourceDisplayLabel } from "../constants/sensorSourceIds.js";
import { useBitstreamDeviceSensorConfigStore } from "../state/bitstreamDeviceSensorConfig.store.js";
import { useWsClientStore } from "../../ws-client-store.js";
import { appendTelemetryActivity } from "../../sensor-telemetry/store/telemetryActivity.store.js";

const LISTENER_ID = "bitstream-sensor-cfg-broker-sync";

/** Map broker payload to a verified store row (mask retained from local truth). */
function payloadToVerifiedRow(p: SensorCfgUpdatedPayload)
{
  const store = useBitstreamDeviceSensorConfigStore.getState();
  const mask =
    store.baselineBySourceId[p.sourceId]?.mask ??
    store.bySourceId[p.sourceId]?.mask ??
    0xff;
  const pmRaw = typeof p.publishMode === "number" ? p.publishMode : 2;
  const publishMode = pmRaw === 0 || pmRaw === 1 || pmRaw === 2 ? pmRaw : 2;
  const ts = typeof p.timestampMs === "number" ? p.timestampMs : Date.now();

  return {
    sourceId: p.sourceId,
    enabled: Boolean(p.enabled),
    publishMode,
    mask,
    samplingIntervalMs:
      typeof p.samplingIntervalMs === "number" ? p.samplingIntervalMs : 250,
    deltaX100: typeof p.deltaX100 === "number" ? p.deltaX100 : 0,
    minPublishIntervalMs:
      typeof p.minPublishIntervalMs === "number" ? p.minPublishIntervalMs : 0,
    publishIntervalMs:
      typeof p.publishIntervalMs === "number" ? p.publishIntervalMs : 0,
    updatedAtMs: ts,
  };
}

/**
 * Multi-tab SENSOR_CFG fan-out: merge peer Apply/refresh publishes into this tab.
 */
export function useSensorCfgBrokerSync(instanceToken: string): void
{
  useEffect(() => {
    const onMessage = (topic: string, payload: unknown) => {
      if (topic !== SERIALPORT_TOPICS.SENSOR_CFG_UPDATED)
      {
        return;
      }

      const p = payload as SensorCfgUpdatedPayload;
      if (p == null || typeof p.sourceId !== "number")
      {
        return;
      }

      const publisherToken = typeof p.instanceToken === "string" ? p.instanceToken : "";
      if (publisherToken.length > 0 && publisherToken === instanceToken)
      {
        return;
      }

      const row = payloadToVerifiedRow(p);
      useBitstreamDeviceSensorConfigStore.getState().commitFirmwareTruthRows([row]);
      appendTelemetryActivity({
        text: `Config synced from another tab (${getSensorSourceDisplayLabel(p.sourceId)})`,
        tone: "info",
      });
    };

    const ws = useWsClientStore.getState();
    ws.addMessageListener(LISTENER_ID, onMessage);
    void ws.subscribeTopic(SERIALPORT_TOPICS.SENSOR_CFG_UPDATED, 0, "json").catch(() => {
      /* broker may connect later */
    });

    return () => {
      ws.removeMessageListener(LISTENER_ID);
      void ws.unsubscribeTopic(SERIALPORT_TOPICS.SENSOR_CFG_UPDATED).catch(() => {
        /* ignore */
      });
    };
  }, [instanceToken]);
}
