/*******************************************************************************
 * File Name : sensorCfgColdSync.ts
 *
 * Description : Post-handshake SENSOR_CFG_GET cold sync into device config store.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { bs2SensorCfgGetAll } from "./bs2SensorCfgTransport.js";
import { bs2ConfigToDeviceRow } from "./sensorCfgRowMap.js";
import { useBitstreamDeviceSensorConfigStore } from "../state/bitstreamDeviceSensorConfig.store.js";

export type SensorCfgColdSyncResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * GET all four sensors and commit draft + baseline from firmware truth.
 */
export async function runSensorCfgColdSync(): Promise<SensorCfgColdSyncResult>
{
  try
  {
    const cfgs = await bs2SensorCfgGetAll();
    const ts = Date.now();
    const rows = cfgs
      .map((cfg) => bs2ConfigToDeviceRow(cfg, ts))
      .filter((row): row is NonNullable<typeof row> => row != null);

    if (rows.length !== cfgs.length)
    {
      return { ok: false, error: "Cold sync row mapping failed" };
    }

    useBitstreamDeviceSensorConfigStore.getState().commitFirmwareTruthRows(rows);
    useBitstreamDeviceSensorConfigStore.getState().setSensorCfgTruthReady(true);
    return { ok: true };
  }
  catch (e: unknown)
  {
    const msg = e instanceof Error ? e.message : String(e);
    useBitstreamDeviceSensorConfigStore.getState().setSensorCfgTruthReady(false);
    return { ok: false, error: msg };
  }
}
