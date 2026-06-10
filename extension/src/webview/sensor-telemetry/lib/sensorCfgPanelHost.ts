/*******************************************************************************
 * Shared wiring for SENSOR_CFG control panels (Telemetry pane, Inspector, modals).
 ******************************************************************************/

import { useCallback, useEffect, useRef, useState } from "react";
import { syncBmi270FirmwareExtrasFromDevice, applyBmi270FirmwareExtrasIfDirty } from "../../bitstream-app/bridge/bmi270FirmwareExtrasSync.js";
import { acquireBmi270DeferFirmwareApplySession } from "./bmi270DeferFirmwareApplySession.js";
import { useBitstreamAppControl } from "../../bitstream-app/control/bitstreamAppControl.context.js";
import { useBitstreamTransportActions } from "../../bitstream-app/context/bitstreamTransportActions.context.js";
import {
  SENSOR_SOURCE_ID_BMI270,
  getSensorSourceDisplayLabel,
} from "../../bitstream-app/constants/sensorSourceIds.js";
import { useBs2ControlReady } from "../../bitstream-app/hooks/useBs2ControlReady.js";
import { useBitstream2Bmi270Transport } from "../../bitstream-app/hooks/useBitstream2Bmi270Transport.js";
import { useLinkHandshakeSatisfied } from "../../bitstream-app/hooks/useLinkHandshakeSatisfied.js";
import {
  clampBmi270FusionFeedIntervalMs,
  useBitstreamConfigStore,
} from "../../bitstream-app/state/bitstreamConfig.store.js";
import {
  revertBmi270FirmwareExtrasDraftToBaseline,
  useBmi270FirmwareExtrasDraftStore,
} from "../../bitstream-app/state/bmi270FirmwareExtrasDraft.store.js";
import { useBitstreamDeviceSensorConfigStore } from "../../bitstream-app/state/bitstreamDeviceSensorConfig.store.js";
import type { DeviceSensorConfigRow } from "../../bitstream-app/state/bitstreamDeviceSensorConfig.store.js";
import {
  IDLE_SENSOR_CONFIG_ACK,
  type SensorConfigAckState,
} from "../../bitstream-app/types/sensorConfigAck.js";
import type { SensorPublishMode } from "../../bitstream-app/types/bitstreamWorkspaceTypes.js";
import { runSensorCfgApplyScope, type SensorCfgApplyScope } from "./applySensorConfigScope.js";
import { resolveTelemetryConfigLockReason } from "./telemetryConfigPaneLockReason.js";

export function asSensorPublishMode(n: number | undefined): SensorPublishMode {
  if (n === 0 || n === 1 || n === 2) {
    return n;
  }
  return 2;
}

export function ackForSensorSource(
  ack: SensorConfigAckState,
  sourceId: number,
): SensorConfigAckState {
  if (ack.sourceId != null && ack.sourceId !== sourceId) {
    return IDLE_SENSOR_CONFIG_ACK;
  }
  return ack;
}

export type SensorCfgPanelHost = ReturnType<typeof useSensorCfgPanelHost>;

export function useSensorCfgPanelHost(options?: {
  /** When set, BMI270 extras baseline sync runs only if this source is BMI270 or unset. */
  focusSourceId?: number | null;
  onActivity?: (text: string, tone: "ok" | "error" | "warning" | "info") => void;
}) {
  const { focusSourceId = null, onActivity } = options ?? {};

  const {
    setSensorConfig,
    sensorConfigAck,
    refreshAllSensorCfgFromDevice,
    applyDirtySensorConfigs,
    applyDirtySensorConfigForSource,
    revertSensorCfgDraft,
  } = useBitstreamAppControl();

  const rows = useBitstreamDeviceSensorConfigStore((s) => s.bySourceId);
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

  useEffect(() => {
    return acquireBmi270DeferFirmwareApplySession();
  }, []);

  const shouldSyncBmi270Baselines =
    focusSourceId == null || focusSourceId === SENSOR_SOURCE_ID_BMI270;
  const bmi270BaselineSyncInFlightRef = useRef(false);

  useEffect(() => {
    if (!canControl || !shouldSyncBmi270Baselines || !truthReady) {
      return;
    }
    const draft = useBmi270FirmwareExtrasDraftStore.getState();
    if (draft.extrasUserEdited) {
      return;
    }
    /* Sync only while baselines are missing — a render-driven GET storm here
       would clobber in-progress user edits when each sync resolves. */
    if (draft.streamModeBaseline != null && draft.fusionFeedBaselineMs != null) {
      return;
    }
    if (bmi270BaselineSyncInFlightRef.current) {
      return;
    }
    bmi270BaselineSyncInFlightRef.current = true;
    void syncBmi270FirmwareExtrasFromDevice(bmi270Transport)
      .then((res) => {
        if (!res.ok) {
          onActivity?.(
            `BMI270 mode/feed baseline read failed: ${res.error}`,
            "warning",
          );
        }
      })
      .finally(() => {
        bmi270BaselineSyncInFlightRef.current = false;
      });
  }, [bmi270Transport, canControl, onActivity, shouldSyncBmi270Baselines, truthReady]);

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
        if (!res.ok) {
          onActivity?.(res.error ?? "Sensor config apply failed", "error");
        }
      });
    },
    [onActivity, runApplyScope],
  );

  const onApplyAll = useCallback(() => {
    void runApplyScope({ kind: "global" }).then((res) => {
      if (!res.ok) {
        onActivity?.(res.error ?? "Sensor config apply failed", "error");
        return;
      }
      onActivity?.("Sensor config applied to board", "ok");
    });
  }, [onActivity, runApplyScope]);

  const onApplySource = useCallback(
    (sourceId: number) => {
      setBusy(true);
      void (async () => {
        const cfgOk = await applyDirtySensorConfigForSource(sourceId);
        if (!cfgOk) {
          onActivity?.("Sensor config apply failed", "error");
          return;
        }
        if (sourceId === SENSOR_SOURCE_ID_BMI270) {
          const extras = await applyBmi270FirmwareExtrasIfDirty(bmi270Transport);
          if (!extras.ok) {
            onActivity?.(extras.error ?? "BMI270 extras apply failed", "error");
            return;
          }
          const cfg = useBitstreamConfigStore.getState();
          publishBmi270StreamModeUpdated({
            bmi270StreamMode: cfg.bmi270StreamMode,
            firmwareApplied: true,
            timestampMs: Date.now(),
          });
          publishBmi270FusionFeedUpdated({
            appliedIntervalMs: cfg.bmi270FusionFeedIntervalMs,
            timestampMs: Date.now(),
          });
        }
        onActivity?.(
          `Applied ${getSensorSourceDisplayLabel(sourceId)} config to board`,
          "ok",
        );
      })().finally(() => setBusy(false));
    },
    [
      applyDirtySensorConfigForSource,
      bmi270Transport,
      onActivity,
      publishBmi270FusionFeedUpdated,
      publishBmi270StreamModeUpdated,
    ],
  );

  const onRefresh = useCallback(() => {
    if (!canControl) {
      if (lockReason != null) {
        onActivity?.(lockReason.message, lockReason.tone === "muted" ? "info" : "warning");
      }
      return;
    }
    setBusy(true);
    void refreshAllSensorCfgFromDevice()
      .then(async (ok) => {
        if (!ok) {
          onActivity?.(lockReason?.message ?? "Sensor config refresh failed", "error");
          return;
        }
        /* Explicit refresh discards local BMI270 extras drafts in favor of board truth. */
        useBmi270FirmwareExtrasDraftStore.getState().clearExtrasUserEdited();
        const extras = await syncBmi270FirmwareExtrasFromDevice(bmi270Transport);
        if (!extras.ok) {
          onActivity?.(
            `Sensor config refreshed; BMI270 mode/feed read failed: ${extras.error}`,
            "warning",
          );
          return;
        }
        onActivity?.("Sensor config refreshed from board", "ok");
      })
      .finally(() => setBusy(false));
  }, [bmi270Transport, canControl, lockReason, onActivity, refreshAllSensorCfgFromDevice]);

  const onRevertAll = useCallback(() => {
    revertSensorCfgDraft();
    revertBmi270FirmwareExtrasDraftToBaseline();
    onActivity?.("Reverted unsaved sensor config changes", "info");
  }, [onActivity, revertSensorCfgDraft]);

  const onRevertSource = useCallback(
    (sourceId: number) => {
      revertSensorCfgDraft(sourceId);
      if (sourceId === SENSOR_SOURCE_ID_BMI270) {
        revertBmi270FirmwareExtrasDraftToBaseline();
      }
      onActivity?.(
        `Reverted unsaved ${getSensorSourceDisplayLabel(sourceId)} changes`,
        "info",
      );
    },
    [onActivity, revertSensorCfgDraft],
  );

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

  return {
    rows,
    rowForSource: (sourceId: number): DeviceSensorConfigRow | null =>
      rows[sourceId] ?? null,
    fusionFeedIntervalMs,
    canControl,
    lockReason,
    busy,
    truthReady,
    sensorConfigAck,
    setSensorConfig,
    cardApplyProps,
    onRefresh,
    onApplyAll,
    onApplySource,
    onRevertAll,
    onRevertSource,
    onFusionFeedChange,
    onBmi270MaskChange,
    runApplyScope,
  };
}
