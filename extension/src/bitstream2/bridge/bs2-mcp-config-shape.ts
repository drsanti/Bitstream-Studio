/*******************************************************************************
 * File Name : bs2-mcp-config-shape.ts
 *
 * Description : Convert BS2 SENSOR_CFG bodies to legacy MCP tool response shapes.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { Bs2SensorConfig } from "../domains/config/sensor-config";
import { bs2SensorIdToLegacySourceId } from "../domains/sensors/legacy-source-id-map";

export type LegacySensorCfgMcpShape = {
  sourceId: number;
  enabled: boolean;
  publishMode: number;
  samplingIntervalMs: number;
  deltaX100: number;
  minPublishIntervalMs: number;
  publishIntervalMs?: number;
  mask?: number;
};

export function bs2CfgToLegacyMcpShape(cfg: Bs2SensorConfig, sourceIdOverride?: number): LegacySensorCfgMcpShape
{
  const sourceId = sourceIdOverride ?? bs2SensorIdToLegacySourceId(cfg.sensorId) ?? cfg.sensorId;
  return {
    sourceId,
    enabled: cfg.enabled,
    publishMode: cfg.publishMode,
    samplingIntervalMs: cfg.samplingIntervalMs,
    deltaX100: cfg.deltaX100,
    minPublishIntervalMs: cfg.minPublishIntervalMs,
    publishIntervalMs: cfg.publishIntervalMs,
    mask: cfg.mask,
  };
}
