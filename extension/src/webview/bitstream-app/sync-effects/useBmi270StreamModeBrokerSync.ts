/*******************************************************************************
 * File Name : useBmi270StreamModeBrokerSync.ts
 *
 * Description : Subscribe to serialport/bmi270-stream-mode-updated and merge
 *               Raw / Fusion / Hybrid into all open webview instances.
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
  type Bmi270StreamModeUpdatedPayload,
} from "../../../serialport-bridge/protocol.js";
import { applyBmi270StreamModeFromBrokerUnknown } from "../bmi270/bmi270StreamModeBrokerSync.js";
import { useWsClientStore } from "../../ws-client-store.js";
import { appendTelemetryActivity } from "../../sensor-telemetry/store/telemetryActivity.store.js";

const LISTENER_ID = "bitstream-bmi270-stream-mode-broker-sync";

/**
 * Multi-tab BMI270 stream mode fan-out (mirrors {@link useSensorCfgBrokerSync}).
 */
export function useBmi270StreamModeBrokerSync(instanceToken: string): void
{
  useEffect(() => {
    const onMessage = (topic: string, payload: unknown) => {
      if (topic !== SERIALPORT_TOPICS.BMI270_STREAM_MODE_UPDATED)
      {
        return;
      }

      const p = payload as Bmi270StreamModeUpdatedPayload;
      if (p == null || typeof p.bmi270StreamMode !== "string")
      {
        return;
      }

      const publisherToken = typeof p.instanceToken === "string" ? p.instanceToken : "";
      if (publisherToken.length > 0 && publisherToken === instanceToken)
      {
        return;
      }

      applyBmi270StreamModeFromBrokerUnknown(p);
      appendTelemetryActivity({
        text: `BMI270 stream mode synced from another tab (${p.bmi270StreamMode})`,
        tone: "info",
      });
    };

    const ws = useWsClientStore.getState();
    ws.addMessageListener(LISTENER_ID, onMessage);
    void ws.subscribeTopic(SERIALPORT_TOPICS.BMI270_STREAM_MODE_UPDATED, 0, "json").catch(() => {
      /* broker may connect later */
    });

    return () => {
      ws.removeMessageListener(LISTENER_ID);
      void ws.unsubscribeTopic(SERIALPORT_TOPICS.BMI270_STREAM_MODE_UPDATED).catch(() => {
        /* ignore */
      });
    };
  }, [instanceToken]);
}
