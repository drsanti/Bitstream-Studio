import { useCallback, useEffect, useRef, useState } from "react";
import { requestBmi270StreamModeRetry } from "../bmi270/bmi270StreamModeRetryRequest.js";
import {
  ALL_SENSOR_SOURCE_IDS,
  getSensorSourceDisplayLabel,
  SENSOR_SOURCE_ID_BMI270,
} from "../constants/sensorSourceIds.js";
import { intervalMsFromHz } from "../../../bitstream2/domains/config/sensor-rate-presets.js";
import {
  mergeVerifiedDeviceSensorConfig,
  useBitstreamDeviceSensorConfigStore,
} from "../state/bitstreamDeviceSensorConfig.store.js";
import {
  IDLE_SENSOR_CONFIG_ACK,
  type SensorConfigAckState,
} from "../types/sensorConfigAck.js";
import type { Bs2SensorConfig } from "../../../bitstream2/domains/config/sensor-config.js";
import { bs2SensorCfgSet } from "../bridge/bs2SensorCfgTransport.js";
import { runSensorCfgColdSync } from "../bridge/sensorCfgColdSync.js";
import { deviceRowToBs2Config, bs2ConfigToDeviceRow } from "../bridge/sensorCfgRowMap.js";
import {
  isSensorCfgDirty,
  listDirtySensorSourceIds,
} from "../bridge/sensorCfgDirty.js";
import { isSimulatorTelemetryBackend } from "../utils/bitstreamTelemetryTransport.js";
import type { SensorCfgUpdatedPayload } from "../../../serialport-bridge/protocol.js";

/** Result shape for BS2 SENSOR_CFG_SET. */
export type Bs2SensorCfgApplyResult =
  | { ok: true; applied: Bs2SensorConfig }
  | { ok: false; error: string };

/** Merged UI intent per `sourceId`. */
export type SensorCfgUiPatch = {
  publishMode?: number;
  samplingIntervalMs?: number;
  deltaX100?: number;
  minPublishIntervalMs?: number;
  publishIntervalMs?: number;
  enabled?: boolean;
  mask?: number;
};

export type RequireConnectedSession = (reason: string) => null;

function clampStepMs(valueMs: number, minMs: number, maxMs: number, stepMs: number): number
{
  const clamped = Math.max(minMs, Math.min(maxMs, Math.round(valueMs)));
  if (stepMs <= 1)
  {
    return clamped;
  }
  return Math.round(clamped / stepMs) * stepMs;
}

/**
 * Sensor configuration controller — BS2 SENSOR_CFG_GET cold sync + dirty-only SET apply.
 */
export function useSensorConfigController(deps: {
  isTransportReady: boolean;
  requireConnectedSession: RequireConnectedSession;
  pushLog: (message: string) => void;
  runAction: (name: string, action: () => Promise<void>) => Promise<void>;
  publishSensorCfgUpdated?: (payload: SensorCfgUpdatedPayload) => void;
})
{
  const { isTransportReady, pushLog, runAction, publishSensorCfgUpdated } = deps;

  const [sensorConfigAck, setSensorConfigAck] =
    useState<SensorConfigAckState>(IDLE_SENSOR_CONFIG_ACK);

  const lastSensorCfgAttemptRef = useRef<Partial<Record<number, SensorCfgUiPatch>>>({});
  const sensorConfigAckRef = useRef<SensorConfigAckState>(IDLE_SENSOR_CONFIG_ACK);
  sensorConfigAckRef.current = sensorConfigAck;

  useEffect(() => {
    /* UART BS2 keeps isTransportReady false by design; only reset on simulator disconnect. */
    if (!isSimulatorTelemetryBackend())
    {
      return;
    }
    if (isTransportReady)
    {
      return;
    }
    lastSensorCfgAttemptRef.current = {};
    setSensorConfigAck(IDLE_SENSOR_CONFIG_ACK);
    useBitstreamDeviceSensorConfigStore.getState().resetSensorCfgSyncState();
  }, [isTransportReady]);

  const getSensorConfig = useCallback(async (sourceId: number) => {
    const current = useBitstreamDeviceSensorConfigStore.getState().bySourceId[sourceId];
    if (!current)
    {
      return null;
    }
    return {
      publishMode: current.publishMode,
      samplingIntervalMs: current.samplingIntervalMs,
      deltaX100: current.deltaX100,
      minPublishIntervalMs: current.minPublishIntervalMs,
      publishIntervalMs: current.publishIntervalMs ?? 0,
      enabled: current.enabled,
    };
  }, []);

  const applyLocalPatch = useCallback(
    (sourceId: number, patch: SensorCfgUiPatch) => {
      lastSensorCfgAttemptRef.current[sourceId] = { ...patch };
      const current = useBitstreamDeviceSensorConfigStore.getState().bySourceId[sourceId];
      const nextPublishMode =
        patch.publishMode == null
          ? (current?.publishMode ?? 0)
          : Math.max(0, Math.min(2, Math.round(patch.publishMode)));
      const nextSamplingIntervalMs =
        patch.samplingIntervalMs == null
          ? (current?.samplingIntervalMs ?? 20)
          : Math.max(1, Math.min(60000, Math.round(patch.samplingIntervalMs)));
      const nextDeltaX100 =
        patch.deltaX100 == null
          ? (current?.deltaX100 ?? 0)
          : Math.max(0, Math.min(65535, Math.round(patch.deltaX100)));
      const nextMinPublishIntervalMs =
        patch.minPublishIntervalMs == null
          ? (current?.minPublishIntervalMs ?? 0)
          : clampStepMs(patch.minPublishIntervalMs, 0, 60000, 10);
      const nextPublishIntervalMs =
        patch.publishIntervalMs == null
          ? (current?.publishIntervalMs ?? 0)
          : clampStepMs(patch.publishIntervalMs, 0, 60000, 10);
      const nextEnabled =
        patch.enabled == null ? (current?.enabled ?? false) : Boolean(patch.enabled);
      const nextMask =
        patch.mask == null
          ? (current?.mask ?? 0xff)
          : Math.max(0, Math.min(255, Math.round(patch.mask)));

      mergeVerifiedDeviceSensorConfig({
        sourceId,
        enabled: nextEnabled,
        publishMode: nextPublishMode,
        mask: nextMask,
        samplingIntervalMs: nextSamplingIntervalMs,
        deltaX100: nextDeltaX100,
        minPublishIntervalMs: nextMinPublishIntervalMs,
        publishIntervalMs: nextPublishIntervalMs,
        updatedAtMs: current?.updatedAtMs ?? 0,
      });
    },
    [],
  );

  const setSensorConfig = useCallback(
    (sourceId: number, patch: SensorCfgUiPatch) => {
      applyLocalPatch(sourceId, patch);
    },
    [applyLocalPatch],
  );

  const publishRowFanOut = useCallback(
    (row: {
      sourceId: number;
      enabled: boolean;
      publishMode: number;
      samplingIntervalMs: number;
      deltaX100: number;
      minPublishIntervalMs: number;
      publishIntervalMs: number;
    }) => {
      if (publishSensorCfgUpdated == null)
      {
        return;
      }
      publishSensorCfgUpdated({
        sourceId: row.sourceId,
        enabled: row.enabled,
        publishMode: row.publishMode,
        samplingIntervalMs: row.samplingIntervalMs,
        deltaX100: row.deltaX100,
        minPublishIntervalMs: row.minPublishIntervalMs,
        publishIntervalMs: row.publishIntervalMs,
        timestampMs: Date.now(),
      });
    },
    [publishSensorCfgUpdated],
  );

  const refreshAllSensorCfgFromDevice = useCallback(async (): Promise<boolean> => {
    let ok = false;
    await runAction("Refresh sensor config", async () => {
      pushLog("Reading config from board (4 sensors)…");
      const result = await runSensorCfgColdSync();
      if (!result.ok)
      {
        pushLog(`Sensor config read failed: ${result.error}`);
        setSensorConfigAck({
          state: "error",
          message: result.error,
          atMs: Date.now(),
        });
        ok = false;
        return;
      }
      pushLog("Sensor config loaded from board");
      setSensorConfigAck({ state: "idle" });
      ok = true;
    });
    return ok;
  }, [pushLog, runAction]);

  const applyDirtySensorConfigs = useCallback(async (): Promise<boolean> => {
    const dirtyIds = listDirtySensorSourceIds();
    if (dirtyIds.length === 0)
    {
      pushLog("No sensor config changes to apply");
      return true;
    }

    let ok = false;
    await runAction("Apply sensor config", async () => {
      const draftStore = useBitstreamDeviceSensorConfigStore.getState().bySourceId;
      const appliedRows: NonNullable<ReturnType<typeof bs2ConfigToDeviceRow>>[] = [];
      const ts = Date.now();

      for (const sourceId of dirtyIds)
      {
        const draft = draftStore[sourceId];
        if (draft == null)
        {
          continue;
        }

        setSensorConfigAck({
          state: "pending",
          sourceId,
          pendingReason: "sensor_cfg",
          atMs: Date.now(),
        });

        try
        {
          const ackCfg = await bs2SensorCfgSet(deviceRowToBs2Config(draft));
          const row = bs2ConfigToDeviceRow(ackCfg, ts);
          if (row == null)
          {
            throw new Error(`SET ack mapping failed for ${getSensorSourceDisplayLabel(sourceId)}`);
          }
          appliedRows.push(row);
          publishRowFanOut(row);
        }
        catch (e: unknown)
        {
          const msg = e instanceof Error ? e.message : String(e);
          pushLog(`Apply failed (${getSensorSourceDisplayLabel(sourceId)}): ${msg}`);
          setSensorConfigAck({
            state: "error",
            sourceId,
            pendingReason: "sensor_cfg",
            message: msg,
            atMs: Date.now(),
          });
          ok = false;
          return;
        }
      }

      if (appliedRows.length > 0)
      {
        useBitstreamDeviceSensorConfigStore.getState().commitFirmwareTruthRows(appliedRows);
      }

      const labels = dirtyIds.map((id) => getSensorSourceDisplayLabel(id)).join(", ");
      pushLog(`Applied config: ${labels}`);
      setSensorConfigAck({ state: "ok", atMs: Date.now() });
      ok = true;
    });

    return ok;
  }, [publishRowFanOut, pushLog, runAction]);

  const applyDirtySensorConfigForSource = useCallback(async (sourceId: number): Promise<boolean> => {
    if (!listDirtySensorSourceIds().includes(sourceId))
    {
      return true;
    }

    let ok = false;
    await runAction("Apply sensor config", async () => {
      const draftStore = useBitstreamDeviceSensorConfigStore.getState().bySourceId;
      const draft = draftStore[sourceId];
      if (draft == null)
      {
        ok = true;
        return;
      }

      setSensorConfigAck({
        state: "pending",
        sourceId,
        pendingReason: "sensor_cfg",
        atMs: Date.now(),
      });

      try
      {
        const ackCfg = await bs2SensorCfgSet(deviceRowToBs2Config(draft));
        const row = bs2ConfigToDeviceRow(ackCfg, Date.now());
        if (row == null)
        {
          throw new Error(`SET ack mapping failed for ${getSensorSourceDisplayLabel(sourceId)}`);
        }
        useBitstreamDeviceSensorConfigStore.getState().commitFirmwareTruthRows([row]);
        publishRowFanOut(row);
        pushLog(`Applied config: ${getSensorSourceDisplayLabel(sourceId)}`);
        setSensorConfigAck({ state: "ok", atMs: Date.now() });
        ok = true;
      }
      catch (e: unknown)
      {
        const msg = e instanceof Error ? e.message : String(e);
        pushLog(`Apply failed (${getSensorSourceDisplayLabel(sourceId)}): ${msg}`);
        setSensorConfigAck({
          state: "error",
          sourceId,
          pendingReason: "sensor_cfg",
          message: msg,
          atMs: Date.now(),
        });
        ok = false;
      }
    });

    return ok;
  }, [publishRowFanOut, pushLog, runAction]);

  const revertSensorCfgDraft = useCallback((sourceId?: number) => {
    useBitstreamDeviceSensorConfigStore.getState().revertDraftToBaseline(sourceId);
    if (sourceId == null)
    {
      pushLog("Reverted all sensor config drafts");
    }
    else
    {
      pushLog(`Reverted draft for ${getSensorSourceDisplayLabel(sourceId)}`);
    }
  }, [pushLog]);

  const getBmi270SensorConfig = useCallback(
    async () => getSensorConfig(SENSOR_SOURCE_ID_BMI270),
    [getSensorConfig],
  );

  const setBmi270SensorConfig = useCallback(
    (patch: SensorCfgUiPatch) => setSensorConfig(SENSOR_SOURCE_ID_BMI270, patch),
    [setSensorConfig],
  );

  const setBmi270SamplingIntervalMs = useCallback(
    (samplingIntervalMs: number) => {
      setBmi270SensorConfig({ samplingIntervalMs });
    },
    [setBmi270SensorConfig],
  );

  const declareBmi270OutputModePending = useCallback(() => {
    /* Intentionally empty — instant UI; separate BMI270 mode path may be wired later. */
  }, []);

  const completeBmi270OutputModeApply = useCallback(
    (ok: boolean, message?: string) => {
      if (!ok)
      {
        pushLog(`BMI270 stream mode apply failed: ${message ?? "rejected"}`);
      }
    },
    [pushLog],
  );

  const clearSensorConfigAck = useCallback(() => {
    setSensorConfigAck(IDLE_SENSOR_CONFIG_ACK);
  }, []);

  const retrySensorConfigAck = useCallback(() => {
    const ack = sensorConfigAckRef.current ?? IDLE_SENSOR_CONFIG_ACK;
    if (ack.state !== "error")
    {
      return;
    }

    if (ack.pendingReason === "bmi270_output_mode")
    {
      pushLog("Retry requested: BMI270 stream mode");
      requestBmi270StreamModeRetry();
      declareBmi270OutputModePending();
      return;
    }

    void applyDirtySensorConfigs();
  }, [applyDirtySensorConfigs, declareBmi270OutputModePending, pushLog]);

  const getLastAttemptPatch = useCallback((sourceId: number) => {
    return lastSensorCfgAttemptRef.current[sourceId];
  }, []);

  const applyAllSensorsAtHz = useCallback(
    (hz: number, options?: { publishMode?: 0 | 1 | 2 }) => {
      const samplingIntervalMs = intervalMsFromHz(hz);
      const publishMode = options?.publishMode ?? 0;
      pushLog(
        `Apply all sensors at ${hz} Hz (local draft; use Apply to send changed sensors)`,
      );
      for (const sourceId of ALL_SENSOR_SOURCE_IDS)
      {
        setSensorConfig(sourceId, {
          enabled: true,
          samplingIntervalMs,
          publishIntervalMs: 0,
          publishMode,
        });
      }
      return samplingIntervalMs;
    },
    [pushLog, setSensorConfig],
  );

  return {
    sensorConfigAck,
    getLastAttemptPatch,
    getSensorConfig,
    setSensorConfig,
    getBmi270SensorConfig,
    setBmi270SensorConfig,
    setBmi270SamplingIntervalMs,
    declareBmi270OutputModePending,
    completeBmi270OutputModeApply,
    clearSensorConfigAck,
    retrySensorConfigAck,
    applyAllSensorsAtHz,
    refreshAllSensorCfgFromDevice,
    applyDirtySensorConfigs,
    applyDirtySensorConfigForSource,
    revertSensorCfgDraft,
    isSensorCfgDirty,
    listDirtySensorSourceIds,
  };
}
