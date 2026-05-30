/*******************************************************************************
 * File Name : configPaneDirty.ts
 *
 * Description : Dirty sensor list for Configuration pane (SENSOR_CFG + BMI270 extras).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { listDirtySensorSourceIdsFromState } from "../../bitstream-app/bridge/sensorCfgDirty.js";
import { SENSOR_SOURCE_ID_BMI270 } from "../../bitstream-app/constants/sensorSourceIds.js";
import { isBmi270FirmwareExtrasDirty } from "../../bitstream-app/state/bmi270FirmwareExtrasDraft.store.js";
import { useBitstreamConfigStore } from "../../bitstream-app/state/bitstreamConfig.store.js";
import { useBitstreamDeviceSensorConfigStore } from "../../bitstream-app/state/bitstreamDeviceSensorConfig.store.js";
import { useBmi270FirmwareExtrasDraftStore } from "../../bitstream-app/state/bmi270FirmwareExtrasDraft.store.js";

const EMPTY: number[] = [];

/** Legacy SENSOR_CFG dirty ids plus BMI270 when output mode / fusion feed drafts differ. */
export function listConfigPaneDirtySourceIds(): number[]
{
  const { bySourceId, baselineBySourceId, sensorCfgTruthReady } =
    useBitstreamDeviceSensorConfigStore.getState();
  const dirty = listDirtySensorSourceIdsFromState(
    bySourceId,
    baselineBySourceId,
    sensorCfgTruthReady,
  );

  if (!isBmi270FirmwareExtrasDirty())
  {
    return dirty;
  }
  if (dirty.includes(SENSOR_SOURCE_ID_BMI270))
  {
    return dirty;
  }
  return [...dirty, SENSOR_SOURCE_ID_BMI270];
}

/** Reactive dirty list for Apply bar and tab indicators. */
export function useConfigPaneDirtySourceIds(): number[]
{
  const deviceSlice = useBitstreamDeviceSensorConfigStore(
    useShallow((state) => ({
      bySourceId: state.bySourceId,
      baselineBySourceId: state.baselineBySourceId,
      sensorCfgTruthReady: state.sensorCfgTruthReady,
    })),
  );
  const deferApply = useBmi270FirmwareExtrasDraftStore((s) => s.deferFirmwareApply);
  const streamBaseline = useBmi270FirmwareExtrasDraftStore((s) => s.streamModeBaseline);
  const feedBaseline = useBmi270FirmwareExtrasDraftStore((s) => s.fusionFeedBaselineMs);
  const extrasUserEdited = useBmi270FirmwareExtrasDraftStore((s) => s.extrasUserEdited);
  const streamMode = useBitstreamConfigStore((s) => s.bmi270StreamMode);
  const fusionFeedMs = useBitstreamConfigStore((s) => s.bmi270FusionFeedIntervalMs);

  return useMemo(() => {
    const dirty = listDirtySensorSourceIdsFromState(
      deviceSlice.bySourceId,
      deviceSlice.baselineBySourceId,
      deviceSlice.sensorCfgTruthReady,
    );

    const extrasDirty =
      deferApply &&
      (extrasUserEdited ||
        streamBaseline == null ||
        feedBaseline == null ||
        streamMode !== streamBaseline ||
        fusionFeedMs !== feedBaseline);

    if (!extrasDirty)
    {
      return dirty.length === 0 ? EMPTY : dirty;
    }
    if (dirty.includes(SENSOR_SOURCE_ID_BMI270))
    {
      return dirty.length === 0 ? EMPTY : dirty;
    }
    return dirty.length === 0 ? [SENSOR_SOURCE_ID_BMI270] : [...dirty, SENSOR_SOURCE_ID_BMI270];
  }, [deferApply, deviceSlice, extrasUserEdited, feedBaseline, fusionFeedMs, streamBaseline, streamMode]);
}

/** Whether one sensor tab should show the unsaved dot. */
export function isConfigPaneSensorTabDirty(sourceId: number, sensorCfgDirty: boolean): boolean
{
  if (sensorCfgDirty)
  {
    return true;
  }
  if (sourceId === SENSOR_SOURCE_ID_BMI270)
  {
    return isBmi270FirmwareExtrasDirty();
  }
  return false;
}
