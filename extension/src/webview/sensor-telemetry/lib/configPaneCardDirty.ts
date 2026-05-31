/*******************************************************************************
 * File Name : configPaneCardDirty.ts
 *
 * Description : Per-card dirty flags for sensor configuration TRNInteractiveCards.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.1
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { SENSOR_SOURCE_ID_BMI270 } from "../../bitstream-app/constants/sensorSourceIds.js";
import type { DeviceSensorConfigRow } from "../../bitstream-app/state/bitstreamDeviceSensorConfig.store.js";
import { useBitstreamDeviceSensorConfigStore } from "../../bitstream-app/state/bitstreamDeviceSensorConfig.store.js";
import { useBitstreamConfigStore } from "../../bitstream-app/state/bitstreamConfig.store.js";
import { useBmi270FirmwareExtrasDraftStore } from "../../bitstream-app/state/bmi270FirmwareExtrasDraft.store.js";

export type SensorCfgRowField = keyof Pick<
  DeviceSensorConfigRow,
  | "enabled"
  | "publishMode"
  | "mask"
  | "samplingIntervalMs"
  | "deltaX100"
  | "minPublishIntervalMs"
  | "publishIntervalMs"
>;

/** True when any listed draft field differs from firmware baseline for one sensor. */
export function isSensorCfgFieldsDirty(
  sourceId: number,
  fields: readonly SensorCfgRowField[],
): boolean
{
  const { bySourceId, baselineBySourceId, sensorCfgTruthReady } =
    useBitstreamDeviceSensorConfigStore.getState();
  if (!sensorCfgTruthReady)
  {
    return false;
  }
  const draft = bySourceId[sourceId];
  const baseline = baselineBySourceId[sourceId];
  if (draft == null || baseline == null)
  {
    return false;
  }
  return fields.some((field) => draft[field] !== baseline[field]);
}

function useSensorCfgFieldsDirtySelector(
  sourceId: number,
  fields: readonly SensorCfgRowField[],
): boolean
{
  return useBitstreamDeviceSensorConfigStore((state) => {
    if (!state.sensorCfgTruthReady)
    {
      return false;
    }
    const draft = state.bySourceId[sourceId];
    const baseline = state.baselineBySourceId[sourceId];
    if (draft == null || baseline == null)
    {
      return false;
    }
    return fields.some((field) => draft[field] !== baseline[field]);
  });
}

export function isBmi270OperationCardDirty(): boolean
{
  return isSensorCfgFieldsDirty(SENSOR_SOURCE_ID_BMI270, ["enabled", "publishMode"]);
}

export function isBmi270OutputProfileCardDirty(): boolean
{
  return (
    isSensorCfgFieldsDirty(SENSOR_SOURCE_ID_BMI270, ["mask"]) ||
    isBmi270StreamModeDraftDirty()
  );
}

export function isBmi270TelemetryChannelsCardDirty(): boolean
{
  return isSensorCfgFieldsDirty(SENSOR_SOURCE_ID_BMI270, ["mask"]);
}

function isBmi270StreamModeDraftDirty(): boolean
{
  const { deferFirmwareApply, streamModeBaseline } = useBmi270FirmwareExtrasDraftStore.getState();
  if (!deferFirmwareApply)
  {
    return false;
  }
  if (streamModeBaseline == null)
  {
    return true;
  }
  return useBitstreamConfigStore.getState().bmi270StreamMode !== streamModeBaseline;
}

export function isBmi270FusionFeedCardDirty(): boolean
{
  return isBmi270FusionFeedDraftDirty();
}

function isBmi270FusionFeedDraftDirty(): boolean
{
  const { deferFirmwareApply, fusionFeedBaselineMs } = useBmi270FirmwareExtrasDraftStore.getState();
  if (!deferFirmwareApply)
  {
    return false;
  }
  if (fusionFeedBaselineMs == null)
  {
    return true;
  }
  return useBitstreamConfigStore.getState().bmi270FusionFeedIntervalMs !== fusionFeedBaselineMs;
}

export function isBmi270SamplingCardDirty(): boolean
{
  return isSensorCfgFieldsDirty(SENSOR_SOURCE_ID_BMI270, ["samplingIntervalMs"]);
}

export function isBmi270DeltaCardDirty(): boolean
{
  return isSensorCfgFieldsDirty(SENSOR_SOURCE_ID_BMI270, ["deltaX100"]);
}

export function isBmi270MinPublishCardDirty(): boolean
{
  return isSensorCfgFieldsDirty(SENSOR_SOURCE_ID_BMI270, ["minPublishIntervalMs"]);
}

export function isSensorOperationCardDirty(sourceId: number): boolean
{
  return isSensorCfgFieldsDirty(sourceId, ["enabled", "publishMode"]);
}

export function isSensorSamplingCardDirty(sourceId: number): boolean
{
  return isSensorCfgFieldsDirty(sourceId, ["samplingIntervalMs"]);
}

export function isSensorDeltaCardDirty(sourceId: number): boolean
{
  return isSensorCfgFieldsDirty(sourceId, ["deltaX100"]);
}

export function isSensorMinPublishCardDirty(sourceId: number): boolean
{
  return isSensorCfgFieldsDirty(sourceId, ["minPublishIntervalMs"]);
}

export function useBmi270OperationCardDirty(): boolean
{
  return useSensorCfgFieldsDirtySelector(SENSOR_SOURCE_ID_BMI270, ["enabled", "publishMode"]);
}

export function useBmi270OutputProfileCardDirty(): boolean
{
  const maskDirty = useSensorCfgFieldsDirtySelector(SENSOR_SOURCE_ID_BMI270, ["mask"]);
  const streamMode = useBitstreamConfigStore((s) => s.bmi270StreamMode);
  const deferApply = useBmi270FirmwareExtrasDraftStore((s) => s.deferFirmwareApply);
  const streamBaseline = useBmi270FirmwareExtrasDraftStore((s) => s.streamModeBaseline);

  if (!deferApply)
  {
    return maskDirty;
  }
  if (streamBaseline == null)
  {
    return true;
  }
  return maskDirty || streamMode !== streamBaseline;
}

export function useBmi270FusionFeedCardDirty(): boolean
{
  const fusionFeedMs = useBitstreamConfigStore((s) => s.bmi270FusionFeedIntervalMs);
  const deferApply = useBmi270FirmwareExtrasDraftStore((s) => s.deferFirmwareApply);
  const feedBaseline = useBmi270FirmwareExtrasDraftStore((s) => s.fusionFeedBaselineMs);

  if (!deferApply)
  {
    return false;
  }
  if (feedBaseline == null)
  {
    return true;
  }
  return fusionFeedMs !== feedBaseline;
}

export function useBmi270SamplingCardDirty(): boolean
{
  return useSensorCfgFieldsDirtySelector(SENSOR_SOURCE_ID_BMI270, ["samplingIntervalMs"]);
}

export function useBmi270DeltaCardDirty(): boolean
{
  return useSensorCfgFieldsDirtySelector(SENSOR_SOURCE_ID_BMI270, ["deltaX100"]);
}

export function useBmi270MinPublishCardDirty(): boolean
{
  return useSensorCfgFieldsDirtySelector(SENSOR_SOURCE_ID_BMI270, ["minPublishIntervalMs"]);
}

export function useBmi270TelemetryChannelsCardDirty(): boolean
{
  return useSensorCfgFieldsDirtySelector(SENSOR_SOURCE_ID_BMI270, ["mask"]);
}

export function useSensorOperationCardDirty(sourceId: number): boolean
{
  return useSensorCfgFieldsDirtySelector(sourceId, ["enabled", "publishMode"]);
}

export function useSensorSamplingCardDirty(sourceId: number): boolean
{
  return useSensorCfgFieldsDirtySelector(sourceId, ["samplingIntervalMs"]);
}

export function useSensorDeltaCardDirty(sourceId: number): boolean
{
  return useSensorCfgFieldsDirtySelector(sourceId, ["deltaX100"]);
}

export function useSensorMinPublishCardDirty(sourceId: number): boolean
{
  return useSensorCfgFieldsDirtySelector(sourceId, ["minPublishIntervalMs"]);
}
