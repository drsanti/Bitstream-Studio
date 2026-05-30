/*******************************************************************************
 * File Name : sensorCfgDirty.ts
 *
 * Description : Compare draft vs firmware baseline rows for dirty-only apply.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useShallow } from "zustand/react/shallow";
import { ALL_SENSOR_SOURCE_IDS } from "../constants/sensorSourceIds.js";
import type { DeviceSensorConfigRow } from "../state/bitstreamDeviceSensorConfig.store.js";
import { useBitstreamDeviceSensorConfigStore } from "../state/bitstreamDeviceSensorConfig.store.js";

const EMPTY_DIRTY_SOURCE_IDS: number[] = [];

/** True when draft and baseline rows match on all cfg fields. */
export function sensorCfgRowsEqual(
  draft: DeviceSensorConfigRow | undefined,
  baseline: DeviceSensorConfigRow | undefined,
): boolean
{
  if (draft == null || baseline == null)
  {
    return draft == null && baseline == null;
  }

  return (
    draft.enabled === baseline.enabled &&
    draft.publishMode === baseline.publishMode &&
    draft.mask === baseline.mask &&
    draft.samplingIntervalMs === baseline.samplingIntervalMs &&
    draft.deltaX100 === baseline.deltaX100 &&
    draft.minPublishIntervalMs === baseline.minPublishIntervalMs &&
    draft.publishIntervalMs === baseline.publishIntervalMs
  );
}

/** Legacy sourceIds whose draft differs from firmware baseline. */
export function listDirtySensorSourceIdsFromState(
  bySourceId: Partial<Record<number, DeviceSensorConfigRow>>,
  baselineBySourceId: Partial<Record<number, DeviceSensorConfigRow>>,
  sensorCfgTruthReady: boolean,
): number[]
{
  if (!sensorCfgTruthReady)
  {
    return EMPTY_DIRTY_SOURCE_IDS;
  }

  const dirty: number[] = [];
  for (const sourceId of ALL_SENSOR_SOURCE_IDS)
  {
    const baseline = baselineBySourceId[sourceId];
    if (baseline == null)
    {
      continue;
    }
    if (!sensorCfgRowsEqual(bySourceId[sourceId], baseline))
    {
      dirty.push(sourceId);
    }
  }
  return dirty;
}

/** Legacy sourceIds whose draft differs from firmware baseline. */
export function listDirtySensorSourceIds(): number[]
{
  const { bySourceId, baselineBySourceId, sensorCfgTruthReady } =
    useBitstreamDeviceSensorConfigStore.getState();
  return listDirtySensorSourceIdsFromState(
    bySourceId,
    baselineBySourceId,
    sensorCfgTruthReady,
  );
}

/** Reactive dirty list for Apply bar and config pane chrome. */
export function useSensorCfgDirtySourceIds(): number[]
{
  return useBitstreamDeviceSensorConfigStore(
    useShallow((state) =>
      listDirtySensorSourceIdsFromState(
        state.bySourceId,
        state.baselineBySourceId,
        state.sensorCfgTruthReady,
      ),
    ),
  );
}

/** Whether one sensor draft differs from baseline. */
export function isSensorCfgDirty(sourceId: number): boolean
{
  const { bySourceId, baselineBySourceId, sensorCfgTruthReady } =
    useBitstreamDeviceSensorConfigStore.getState();
  if (!sensorCfgTruthReady)
  {
    return false;
  }
  const baseline = baselineBySourceId[sourceId];
  if (baseline == null)
  {
    return false;
  }
  return !sensorCfgRowsEqual(bySourceId[sourceId], baseline);
}
