/*******************************************************************************
 * File Name : bs2SensorCfgTransport.ts
 *
 * Description : BS2 SENSOR_CFG_GET / SENSOR_CFG_SET helpers for Bitstream app.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { BS2_CMD } from "../../../bitstream2/domains/config/commands.js";
import {
  decodeSensorCfgBody,
  encodeSensorCfgBody,
  encodeSensorCfgGetBody,
  normalizeSensorCfg,
  type Bs2SensorConfig,
} from "../../../bitstream2/domains/config/sensor-config.js";
import { bytesToBase64 } from "../../../bitstream2/util/base64.js";
import { sendBitstream2ReqAwait } from "../../shared/sendBitstream2ReqAwait.js";
import { legacySourceIdToBs2SensorId } from "./bs2-source-id-map.js";
import { ALL_SENSOR_SOURCE_IDS } from "../constants/sensorSourceIds.js";

const GET_TIMEOUT_MS = 2200;
const SET_TIMEOUT_MS = 2600;

/** Read SENSOR_CFG for one legacy sourceId (1–4). */
export async function bs2SensorCfgGetBySourceId(sourceId: number): Promise<Bs2SensorConfig>
{
  const sensorId = legacySourceIdToBs2SensorId(sourceId);
  if (sensorId == null)
  {
    throw new Error(`Unknown sensor sourceId ${sourceId}`);
  }

  const res = await sendBitstream2ReqAwait(
    {
      cmdId: BS2_CMD.SENSOR_CFG_GET,
      bodyB64: bytesToBase64(encodeSensorCfgGetBody(sensorId)),
      timeoutMs: 2000,
      requestId: `bs2-sensor-cfg-get-${sensorId}-${Date.now()}`,
    },
    GET_TIMEOUT_MS,
  );

  if (!res.ok)
  {
    throw new Error(`SENSOR_CFG_GET failed (sourceId=${sourceId}, status=${res.status})`);
  }

  const cfg = decodeSensorCfgBody(res.body);
  if (!cfg)
  {
    throw new Error(
      `SENSOR_CFG_GET decode failed (sourceId=${sourceId}, len=${res.body.byteLength})`,
    );
  }

  return normalizeSensorCfg(cfg);
}

/** Apply SENSOR_CFG_SET and return firmware ack body. */
export async function bs2SensorCfgSet(cfg: Bs2SensorConfig): Promise<Bs2SensorConfig>
{
  const normalized = normalizeSensorCfg(cfg);
  const res = await sendBitstream2ReqAwait(
    {
      cmdId: BS2_CMD.SENSOR_CFG_SET,
      bodyB64: bytesToBase64(encodeSensorCfgBody(normalized)),
      timeoutMs: 2400,
      requestId: `bs2-sensor-cfg-set-${normalized.sensorId}-${Date.now()}`,
    },
    SET_TIMEOUT_MS,
  );

  if (!res.ok)
  {
    throw new Error(`SENSOR_CFG_SET failed (sensorId=${normalized.sensorId}, status=${res.status})`);
  }

  const ackCfg = decodeSensorCfgBody(res.body);
  if (!ackCfg)
  {
    throw new Error(
      `SENSOR_CFG_SET ack decode failed (sensorId=${normalized.sensorId}, len=${res.body.byteLength})`,
    );
  }

  return normalizeSensorCfg(ackCfg);
}

/** GET all four sensors in stable UI order. */
export async function bs2SensorCfgGetAll(): Promise<Bs2SensorConfig[]>
{
  const out: Bs2SensorConfig[] = [];
  for (const sourceId of ALL_SENSOR_SOURCE_IDS)
  {
    out.push(await bs2SensorCfgGetBySourceId(sourceId));
  }
  return out;
}
