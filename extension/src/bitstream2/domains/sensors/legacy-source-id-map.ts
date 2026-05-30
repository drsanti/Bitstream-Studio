/*******************************************************************************
 * File Name : legacy-source-id-map.ts
 *
 * Description : Map legacy sensor.cfg sourceId (1–4) to BS2 sensorId (0–3).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { BS2_SENSOR_ID } from "./sensor-ids";

/** Legacy firmware `sensor.cfg.*` source ids (v1 wire / MCP tools). */
export const LEGACY_SOURCE_ID_SHT40 = 1;
export const LEGACY_SOURCE_ID_DPS368 = 2;
export const LEGACY_SOURCE_ID_BMM350 = 3;
export const LEGACY_SOURCE_ID_BMI270 = 4;

export const LEGACY_ALL_SOURCE_IDS = [
  LEGACY_SOURCE_ID_BMI270,
  LEGACY_SOURCE_ID_BMM350,
  LEGACY_SOURCE_ID_SHT40,
  LEGACY_SOURCE_ID_DPS368,
] as const;

/** Map legacy `sensor.cfg.*` sourceId to BS-framed `sensorId`. */
export function legacySourceIdToBs2SensorId(sourceId: number): number | null
{
  switch (sourceId)
  {
    case LEGACY_SOURCE_ID_BMI270:
      return BS2_SENSOR_ID.BMI270;
    case LEGACY_SOURCE_ID_BMM350:
      return BS2_SENSOR_ID.BMM350;
    case LEGACY_SOURCE_ID_SHT40:
      return BS2_SENSOR_ID.SHT40;
    case LEGACY_SOURCE_ID_DPS368:
      return BS2_SENSOR_ID.DPS368;
    default:
      return null;
  }
}

export function bs2SensorIdToLegacySourceId(sensorId: number): number | null
{
  switch (sensorId)
  {
    case BS2_SENSOR_ID.BMI270:
      return LEGACY_SOURCE_ID_BMI270;
    case BS2_SENSOR_ID.BMM350:
      return LEGACY_SOURCE_ID_BMM350;
    case BS2_SENSOR_ID.SHT40:
      return LEGACY_SOURCE_ID_SHT40;
    case BS2_SENSOR_ID.DPS368:
      return LEGACY_SOURCE_ID_DPS368;
    default:
      return null;
  }
}
