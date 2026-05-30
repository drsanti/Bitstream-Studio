/*******************************************************************************
 * File Name : sensorCfgRowMap.ts
 *
 * Description : Map BS2 SENSOR_CFG payloads to device sensor config store rows.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { Bs2SensorConfig } from "../../../bitstream2/domains/config/sensor-config.js";
import {
  bs2SensorIdToLegacySourceId,
  legacySourceIdToBs2SensorId,
} from "./bs2-source-id-map.js";
import type { DeviceSensorConfigRow } from "../state/bitstreamDeviceSensorConfig.store.js";

/** Convert a BS2 cfg body to a verified store row (legacy sourceId). */
export function bs2ConfigToDeviceRow(
  cfg: Bs2SensorConfig,
  updatedAtMs: number,
): DeviceSensorConfigRow | null
{
  const sourceId = bs2SensorIdToLegacySourceId(cfg.sensorId);
  if (sourceId == null)
  {
    return null;
  }
  return {
    sourceId,
    enabled: cfg.enabled,
    publishMode: cfg.publishMode,
    mask: cfg.mask,
    samplingIntervalMs: cfg.samplingIntervalMs,
    deltaX100: cfg.deltaX100,
    minPublishIntervalMs: cfg.minPublishIntervalMs,
    publishIntervalMs: cfg.publishIntervalMs,
    updatedAtMs,
  };
}

/** Build a BS2 SET body from a store row. */
export function deviceRowToBs2Config(row: DeviceSensorConfigRow): Bs2SensorConfig
{
  const sensorId = legacySourceIdToBs2SensorId(row.sourceId) ?? row.sourceId;
  return {
    sensorId,
    enabled: row.enabled,
    publishMode: row.publishMode as 0 | 1 | 2,
    mask: row.mask,
    samplingIntervalMs: row.samplingIntervalMs,
    deltaX100: row.deltaX100,
    minPublishIntervalMs: row.minPublishIntervalMs,
    publishIntervalMs: row.publishIntervalMs,
  };
}
