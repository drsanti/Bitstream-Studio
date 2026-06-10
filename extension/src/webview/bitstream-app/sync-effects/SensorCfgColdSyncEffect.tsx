/*******************************************************************************
 * File Name : SensorCfgColdSyncEffect.tsx
 *
 * Description : Run SENSOR_CFG_GET × 4 once after link handshake + BS2 control ready.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef } from "react";
import { useBitstreamTransportActions } from "../context/bitstreamTransportActions.context.js";
import { useBs2ControlReady } from "../hooks/useBs2ControlReady.js";
import { useLinkHandshakeSatisfied } from "../hooks/useLinkHandshakeSatisfied.js";
import { useBitstream2Bmi270Transport } from "../hooks/useBitstream2Bmi270Transport.js";
import { useBitstreamConnectionStore } from "../state/bitstreamConnection.store.js";
import { syncBmi270FirmwareExtrasFromDevice } from "../bridge/bmi270FirmwareExtrasSync.js";
import { runSensorCfgColdSync } from "../bridge/sensorCfgColdSync.js";
import { useBmi270FirmwareExtrasDraftStore } from "../state/bmi270FirmwareExtrasDraft.store.js";
import { useBitstreamDeviceSensorConfigStore } from "../state/bitstreamDeviceSensorConfig.store.js";
import { appendTelemetryActivity } from "../../sensor-telemetry/store/telemetryActivity.store.js";

/**
 * Post-handshake cold sync for SENSOR_CFG. Renders nothing; mount under transport provider.
 */
export function SensorCfgColdSyncEffect(props: {
  onTruthReady: (ready: boolean) => void;
})
{
  const { onTruthReady } = props;
  const linkHandshakeOk = useLinkHandshakeSatisfied();
  const bs2Ready = useBs2ControlReady();
  const userPausedLink = useBitstreamConnectionStore((s) => s.userPausedLink);
  const { runAction } = useBitstreamTransportActions();
  const bmi270Transport = useBitstream2Bmi270Transport();
  const syncedForLinkRef = useRef(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!linkHandshakeOk || userPausedLink)
    {
      syncedForLinkRef.current = false;
      inFlightRef.current = false;
      useBitstreamDeviceSensorConfigStore.getState().resetSensorCfgSyncState();
      useBmi270FirmwareExtrasDraftStore.getState().resetBaselines();
      onTruthReady(false);
      return;
    }

    if (!bs2Ready.ready)
    {
      onTruthReady(false);
      return;
    }

    if (syncedForLinkRef.current || inFlightRef.current)
    {
      return;
    }

    inFlightRef.current = true;
    appendTelemetryActivity({
      text: "Reading config from board (4 sensors)…",
      tone: "info",
    });

    void runAction("Sensor cfg cold sync", async () => {
      try
      {
        const result = await runSensorCfgColdSync();
        if (result.ok)
        {
          const extras = await syncBmi270FirmwareExtrasFromDevice(bmi270Transport);
          if (!extras.ok)
          {
            appendTelemetryActivity({
              text: `BMI270 mode/feed read failed: ${extras.error}`,
              tone: "warning",
            });
          }
          syncedForLinkRef.current = true;
          onTruthReady(true);
          appendTelemetryActivity({
            text: "Sensor config loaded from board",
            tone: "ok",
          });
        }
        else
        {
          onTruthReady(false);
          appendTelemetryActivity({
            text: `Sensor config read failed: ${result.error}`,
            tone: "error",
          });
        }
      }
      finally
      {
        inFlightRef.current = false;
      }
    });
  }, [
    bs2Ready.ready,
    bs2Ready.reason,
    linkHandshakeOk,
    onTruthReady,
    runAction,
    userPausedLink,
  ]);

  return null;
}
