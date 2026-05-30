/*******************************************************************************
 * File Name : TelemetryConfigPanel.tsx
 *
 * Description : Left workbench pane — tabbed sensor cfg cards (draft + Apply bar).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.2
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useEffect, useState } from "react";
import { TRNTabs, TRNTabsContent, TRNTabsList } from "../../../ui/TRN";
import { useBitstreamAppControl } from "../../../bitstream-app/control/bitstreamAppControl.context.js";
import {
  SENSOR_SOURCE_ID_BMI270,
  SENSOR_SOURCE_ID_BMM350,
  SENSOR_SOURCE_ID_DPS368,
  SENSOR_SOURCE_ID_SHT40,
  getSensorSourceDisplayLabel,
} from "../../../bitstream-app/constants/sensorSourceIds.js";
import {
  syncBmi270FirmwareExtrasFromDevice,
} from "../../../bitstream-app/bridge/bmi270FirmwareExtrasSync.js";
import { useBitstreamDeviceSensorConfigStore } from "../../../bitstream-app/state/bitstreamDeviceSensorConfig.store.js";
import { useBs2ControlReady } from "../../../bitstream-app/hooks/useBs2ControlReady.js";
import { useLinkHandshakeSatisfied } from "../../../bitstream-app/hooks/useLinkHandshakeSatisfied.js";
import { BMI270ControlPanel } from "../../../bitstream-app/components/bmi270/BMI270ControlPanel.js";
import { BMM350ControlPanel } from "../../../bitstream-app/components/bmm350/BMM350ControlPanel.js";
import { DPS368ControlPanel } from "../../../bitstream-app/components/dps368/DPS368ControlPanel.js";
import { SHT40ControlPanel } from "../../../bitstream-app/components/sht40/SHT40ControlPanel.js";
import type { SensorPublishMode } from "../../../bitstream-app/types/bitstreamWorkspaceTypes.js";
import {
  IDLE_SENSOR_CONFIG_ACK,
  type SensorConfigAckState,
} from "../../../bitstream-app/types/sensorConfigAck.js";
import {
  clampBmi270FusionFeedIntervalMs,
  useBitstreamConfigStore,
} from "../../../bitstream-app/state/bitstreamConfig.store.js";
import {
  revertBmi270FirmwareExtrasDraftToBaseline,
  useBmi270FirmwareExtrasDraftStore,
} from "../../../bitstream-app/state/bmi270FirmwareExtrasDraft.store.js";
import { useBitstream2Bmi270Transport } from "../../../bitstream-app/hooks/useBitstream2Bmi270Transport.js";
import { useBitstreamTransportActions } from "../../../bitstream-app/context/bitstreamTransportActions.context.js";
import { appendTelemetryActivity } from "../../store/telemetryActivity.store.js";
import { SensorCfgTabTrigger } from "../SensorCfgTabTrigger.js";
import {
  isConfigPaneSensorTabDirty,
  listConfigPaneDirtySourceIds,
} from "../../lib/configPaneDirty.js";
import { sensorCfgApplyBarAck } from "../../lib/sensorCfgApplyBarAck.js";
import { resolveTelemetryConfigLockReason } from "../../lib/telemetryConfigPaneLockReason.js";
import {
  runSensorCfgApplyScope,
  sensorCfgApplyScopeLabel,
  type SensorCfgApplyScope,
} from "../../lib/applySensorConfigScope.js";
import { SensorCfgApplyBar } from "./SensorCfgApplyBar.js";

function asPublishMode(n: number | undefined): SensorPublishMode
{
  if (n === 0 || n === 1 || n === 2)
  {
    return n;
  }
  return 2;
}

function ackForSource(ack: SensorConfigAckState, sourceId: number): SensorConfigAckState
{
  if (ack.sourceId != null && ack.sourceId !== sourceId)
  {
    return IDLE_SENSOR_CONFIG_ACK;
  }
  return ack;
}

function dirtyLabelsFromIds(ids: number[]): string
{
  return ids.map((id) => getSensorSourceDisplayLabel(id)).join(", ");
}

/**
 * Per-sensor configuration cards; edits stay draft until Apply.
 */
export function TelemetryConfigPanel()
{
  const {
    setSensorConfig,
    sensorConfigAck,
    refreshAllSensorCfgFromDevice,
    applyDirtySensorConfigs,
    applyDirtySensorConfigForSource,
    revertSensorCfgDraft,
    isSensorCfgDirty,
  } = useBitstreamAppControl();

  const rows = useBitstreamDeviceSensorConfigStore((s) => s.bySourceId);
  const baselines = useBitstreamDeviceSensorConfigStore((s) => s.baselineBySourceId);
  const truthReady = useBitstreamDeviceSensorConfigStore((s) => s.sensorCfgTruthReady);
  const fusionFeedIntervalMs = useBitstreamConfigStore((s) => s.bmi270FusionFeedIntervalMs);

  const linkOk = useLinkHandshakeSatisfied();
  const bs2Ready = useBs2ControlReady();
  const canControl = linkOk && bs2Ready.ready && truthReady;
  const lockReason = resolveTelemetryConfigLockReason(linkOk, bs2Ready, truthReady);

  const bmi270Transport = useBitstream2Bmi270Transport();
  const {
    publishBmi270FusionFeedUpdated,
    publishBmi270StreamModeUpdated,
  } = useBitstreamTransportActions();

  const [busy, setBusy] = useState(false);

  /* Establish BMI270 mode/feed baselines after cold sync when GET succeeded. */
  useEffect(() => {
    if (!canControl)
    {
      return;
    }
    const draft = useBmi270FirmwareExtrasDraftStore.getState();
    if (draft.streamModeBaseline != null && draft.fusionFeedBaselineMs != null)
    {
      return;
    }
    void syncBmi270FirmwareExtrasFromDevice(bmi270Transport).then((res) => {
      if (!res.ok)
      {
        appendTelemetryActivity({
          text: `BMI270 mode/feed baseline read failed: ${res.error}`,
          tone: "warning",
        });
      }
    });
  }, [bmi270Transport, canControl]);

  const bmi270 = rows[SENSOR_SOURCE_ID_BMI270];
  const dps368 = rows[SENSOR_SOURCE_ID_DPS368];
  const sht40 = rows[SENSOR_SOURCE_ID_SHT40];
  const bmm350 = rows[SENSOR_SOURCE_ID_BMM350];

  const onRefresh = useCallback(() => {
    if (!canControl)
    {
      if (lockReason != null)
      {
        appendTelemetryActivity({
          text: lockReason.message,
          tone: lockReason.tone === "muted" ? "info" : "warning",
        });
      }
      return;
    }
    setBusy(true);
    void refreshAllSensorCfgFromDevice()
      .then(async (ok) => {
        if (!ok)
        {
          appendTelemetryActivity({
            text: lockReason?.message ?? "Sensor config refresh failed",
            tone: "error",
          });
          return;
        }
        const extras = await syncBmi270FirmwareExtrasFromDevice(bmi270Transport);
        if (!extras.ok)
        {
          appendTelemetryActivity({
            text: `Sensor config refreshed; BMI270 mode/feed read failed: ${extras.error}`,
            tone: "warning",
          });
          return;
        }
        appendTelemetryActivity({
          text: "Sensor config refreshed from board (incl. BMI270 mode/feed)",
          tone: "ok",
        });
      })
      .finally(() => setBusy(false));
  }, [bmi270Transport, canControl, lockReason, refreshAllSensorCfgFromDevice]);

  const runApplyScope = useCallback(
    (scope: SensorCfgApplyScope) => {
      setBusy(true);
      return runSensorCfgApplyScope({
        scope,
        applyDirtySensorConfigs,
        applyDirtySensorConfigForSource,
        bmi270Transport,
        publishBmi270StreamModeUpdated,
        publishBmi270FusionFeedUpdated,
      }).finally(() => setBusy(false));
    },
    [
      applyDirtySensorConfigForSource,
      applyDirtySensorConfigs,
      bmi270Transport,
      publishBmi270FusionFeedUpdated,
      publishBmi270StreamModeUpdated,
    ],
  );

  const onApplyCard = useCallback(
    (scope: SensorCfgApplyScope) => {
      void runApplyScope(scope).then((res) => {
        if (!res.ok)
        {
          appendTelemetryActivity({
            text: res.error ?? "Sensor config apply failed",
            tone: "error",
          });
          return;
        }
        appendTelemetryActivity({
          text: sensorCfgApplyScopeLabel(scope),
          tone: "ok",
        });
      });
    },
    [runApplyScope],
  );

  const onApply = useCallback(() => {
    const dirtyIds = listConfigPaneDirtySourceIds();
    const labels = dirtyLabelsFromIds(dirtyIds);
    void runApplyScope({ kind: "global" }).then((res) => {
      if (!res.ok)
      {
        appendTelemetryActivity({
          text: res.error ?? "Sensor config apply failed",
          tone: "error",
        });
        return;
      }
      const mode = useBitstreamConfigStore.getState().bmi270StreamMode;
      appendTelemetryActivity({
        text:
          labels.length > 0
            ? `Applied sensor config: ${labels} (BMI270 output ${mode})`
            : `Sensor config applied to board (BMI270 output ${mode})`,
        tone: "ok",
      });
    });
  }, [runApplyScope]);

  const onRevert = useCallback(() => {
    revertSensorCfgDraft();
    revertBmi270FirmwareExtrasDraftToBaseline();
    appendTelemetryActivity({ text: "Reverted unsaved sensor config changes", tone: "info" });
  }, [revertSensorCfgDraft]);

  const onFusionFeedChange = useCallback((nextValue: number) => {
    const clamped = clampBmi270FusionFeedIntervalMs(nextValue);
    useBmi270FirmwareExtrasDraftStore.getState().markExtrasUserEdited();
    useBitstreamConfigStore.getState().setBmi270FusionFeedIntervalMs(clamped);
  }, []);

  const onBmi270MaskChange = useCallback(
    (mask: number) => {
      setSensorConfig(SENSOR_SOURCE_ID_BMI270, { mask });
    },
    [setSensorConfig],
  );

  const applyLockedReason = canControl ? undefined : lockReason?.message;
  const cardApplyProps = {
    canApplyCard: canControl,
    applyBusy: busy,
    applyLockedReason,
    onApplyCard,
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={canControl ? "min-h-0 flex-1" : "pointer-events-none min-h-0 flex-1 opacity-50"}>
        <TRNTabs defaultValue="bmi270" lazyMount className="flex h-full min-h-0 flex-col gap-1 px-1 pb-1">
          <TRNTabsList className="inline-flex w-full shrink-0 gap-1">
            <SensorCfgTabTrigger
              value="bmi270"
              label="BMI270"
              dirty={isConfigPaneSensorTabDirty(
                SENSOR_SOURCE_ID_BMI270,
                isSensorCfgDirty(SENSOR_SOURCE_ID_BMI270),
              )}
              className="flex-1"
            />
            <SensorCfgTabTrigger
              value="dps368"
              label="DPS368"
              dirty={isConfigPaneSensorTabDirty(
                SENSOR_SOURCE_ID_DPS368,
                isSensorCfgDirty(SENSOR_SOURCE_ID_DPS368),
              )}
              className="flex-1"
            />
            <SensorCfgTabTrigger
              value="sht40"
              label="SHT40"
              dirty={isConfigPaneSensorTabDirty(
                SENSOR_SOURCE_ID_SHT40,
                isSensorCfgDirty(SENSOR_SOURCE_ID_SHT40),
              )}
              className="flex-1"
            />
            <SensorCfgTabTrigger
              value="bmm350"
              label="BMM350"
              dirty={isConfigPaneSensorTabDirty(
                SENSOR_SOURCE_ID_BMM350,
                isSensorCfgDirty(SENSOR_SOURCE_ID_BMM350),
              )}
              className="flex-1"
            />
          </TRNTabsList>

          <TRNTabsContent
            value="bmi270"
            keepMounted={false}
            className="mt-0 min-h-0 flex-1 overflow-y-auto"
          >
            {bmi270 != null ? (
              <BMI270ControlPanel
                enabled={bmi270.enabled}
                onEnabledChange={(v) => setSensorConfig(SENSOR_SOURCE_ID_BMI270, { enabled: v })}
                dataRateMs={bmi270.samplingIntervalMs}
                onSamplingFrequencyChange={(v) =>
                  setSensorConfig(SENSOR_SOURCE_ID_BMI270, { samplingIntervalMs: v })
                }
                publishMode={asPublishMode(bmi270.publishMode)}
                onPublishModeChange={(v) =>
                  setSensorConfig(SENSOR_SOURCE_ID_BMI270, { publishMode: v })
                }
                deltaX100={bmi270.deltaX100}
                onDeltaX100Change={(v) => setSensorConfig(SENSOR_SOURCE_ID_BMI270, { deltaX100: v })}
                minPublishIntervalMs={bmi270.minPublishIntervalMs}
                onMinPublishIntervalMsChange={(v) =>
                  setSensorConfig(SENSOR_SOURCE_ID_BMI270, { minPublishIntervalMs: v })
                }
                ack={ackForSource(sensorConfigAck, SENSOR_SOURCE_ID_BMI270)}
                ackSensorSourceId={SENSOR_SOURCE_ID_BMI270}
                fusionFeedIntervalMs={fusionFeedIntervalMs}
                onFusionFeedIntervalChange={onFusionFeedChange}
                fusionFeedAck={{ state: "idle" }}
                draftUntilApply
                mask={bmi270.mask}
                onMaskChange={onBmi270MaskChange}
                {...cardApplyProps}
              />
            ) : null}
          </TRNTabsContent>

          <TRNTabsContent
            value="dps368"
            keepMounted={false}
            className="mt-0 min-h-0 flex-1 overflow-y-auto"
          >
            {dps368 != null ? (
              <DPS368ControlPanel
                enabled={dps368.enabled}
                onEnabledChange={(v) => setSensorConfig(SENSOR_SOURCE_ID_DPS368, { enabled: v })}
                dataRateMs={dps368.samplingIntervalMs}
                onSamplingFrequencyChange={(v) =>
                  setSensorConfig(SENSOR_SOURCE_ID_DPS368, { samplingIntervalMs: v })
                }
                publishMode={asPublishMode(dps368.publishMode)}
                onPublishModeChange={(v) =>
                  setSensorConfig(SENSOR_SOURCE_ID_DPS368, { publishMode: v })
                }
                deltaX100={dps368.deltaX100}
                onDeltaX100Change={(v) => setSensorConfig(SENSOR_SOURCE_ID_DPS368, { deltaX100: v })}
                minPublishIntervalMs={dps368.minPublishIntervalMs}
                onMinPublishIntervalMsChange={(v) =>
                  setSensorConfig(SENSOR_SOURCE_ID_DPS368, { minPublishIntervalMs: v })
                }
                ack={ackForSource(sensorConfigAck, SENSOR_SOURCE_ID_DPS368)}
                ackSensorSourceId={SENSOR_SOURCE_ID_DPS368}
                draftUntilApply
                {...cardApplyProps}
              />
            ) : null}
          </TRNTabsContent>

          <TRNTabsContent
            value="sht40"
            keepMounted={false}
            className="mt-0 min-h-0 flex-1 overflow-y-auto"
          >
            {sht40 != null ? (
              <SHT40ControlPanel
                enabled={sht40.enabled}
                onEnabledChange={(v) => setSensorConfig(SENSOR_SOURCE_ID_SHT40, { enabled: v })}
                dataRateMs={sht40.samplingIntervalMs}
                onSamplingFrequencyChange={(v) =>
                  setSensorConfig(SENSOR_SOURCE_ID_SHT40, { samplingIntervalMs: v })
                }
                publishMode={asPublishMode(sht40.publishMode)}
                onPublishModeChange={(v) =>
                  setSensorConfig(SENSOR_SOURCE_ID_SHT40, { publishMode: v })
                }
                deltaX100={sht40.deltaX100}
                onDeltaX100Change={(v) => setSensorConfig(SENSOR_SOURCE_ID_SHT40, { deltaX100: v })}
                minPublishIntervalMs={sht40.minPublishIntervalMs}
                onMinPublishIntervalMsChange={(v) =>
                  setSensorConfig(SENSOR_SOURCE_ID_SHT40, { minPublishIntervalMs: v })
                }
                ack={ackForSource(sensorConfigAck, SENSOR_SOURCE_ID_SHT40)}
                ackSensorSourceId={SENSOR_SOURCE_ID_SHT40}
                draftUntilApply
                {...cardApplyProps}
              />
            ) : null}
          </TRNTabsContent>

          <TRNTabsContent
            value="bmm350"
            keepMounted={false}
            className="mt-0 min-h-0 flex-1 overflow-y-auto"
          >
            {bmm350 != null ? (
              <BMM350ControlPanel
                enabled={bmm350.enabled}
                onEnabledChange={(v) => setSensorConfig(SENSOR_SOURCE_ID_BMM350, { enabled: v })}
                dataRateMs={bmm350.samplingIntervalMs}
                onSamplingFrequencyChange={(v) =>
                  setSensorConfig(SENSOR_SOURCE_ID_BMM350, { samplingIntervalMs: v })
                }
                publishMode={asPublishMode(bmm350.publishMode)}
                onPublishModeChange={(v) =>
                  setSensorConfig(SENSOR_SOURCE_ID_BMM350, { publishMode: v })
                }
                deltaX100={bmm350.deltaX100}
                onDeltaX100Change={(v) => setSensorConfig(SENSOR_SOURCE_ID_BMM350, { deltaX100: v })}
                minPublishIntervalMs={bmm350.minPublishIntervalMs}
                onMinPublishIntervalMsChange={(v) =>
                  setSensorConfig(SENSOR_SOURCE_ID_BMM350, { minPublishIntervalMs: v })
                }
                ack={ackForSource(sensorConfigAck, SENSOR_SOURCE_ID_BMM350)}
                ackSensorSourceId={SENSOR_SOURCE_ID_BMM350}
                draftUntilApply
                {...cardApplyProps}
              />
            ) : null}
          </TRNTabsContent>
        </TRNTabs>
      </div>

      <SensorCfgApplyBar
        canControl={canControl}
        busy={busy}
        onRefresh={onRefresh}
        onRevert={onRevert}
        onApply={onApply}
        applyAck={sensorCfgApplyBarAck(sensorConfigAck)}
      />
    </div>
  );
}
