/*******************************************************************************
 * File Name : sensor-config-get.ts
 *
 * Description : MCP sensor_config_get via BS2 SENSOR_CFG_GET.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { bs2CfgToLegacyMcpShape } from "../../../bitstream2/bridge/bs2-mcp-config-shape";
import type { BitstreamMcpRuntimeContext, BitstreamMcpToolRegistration } from "../types";

const SENSOR_CONFIG_GET_INPUT_SCHEMA = {
  type: "object",
  properties: {
    sourceId: { type: ["number", "string"] },
    requestId: { type: "string" },
  },
  required: ["sourceId"],
  additionalProperties: true,
} as const;

interface SensorConfigGetArgs
{
  sourceId: number | string;
  requestId?: string;
}

function toNumber(value: unknown): number | null
{
  if (typeof value === "number" && Number.isFinite(value))
  {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0)
  {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function createSensorConfigGetTool(runtime: BitstreamMcpRuntimeContext): BitstreamMcpToolRegistration
{
  return {
    name: "bitstream_sensor_config_get",
    description: "Read sensor configuration for a specific sourceId (BS2 SENSOR_CFG_GET).",
    inputSchema: SENSOR_CONFIG_GET_INPUT_SCHEMA,
    handler: async (args: unknown) =>
    {
      const session = runtime.getSession();
      if (!session)
      {
        return {
          ok: false,
          error: "Bitstream session not available",
        };
      }

      const typedArgs = (args ?? {}) as Partial<SensorConfigGetArgs>;
      const sourceIdRaw = toNumber(typedArgs.sourceId);
      const sourceId = sourceIdRaw === null ? null : Math.trunc(sourceIdRaw);
      if (sourceId === null || sourceId <= 0 || sourceId > 255)
      {
        return { ok: false, error: "sourceId is required and must be a positive integer (1-255)" };
      }

      const requestId = typedArgs.requestId ?? `sensor-cfg-get-${sourceId}-${Date.now()}`;
      try
      {
        const cfg = await session.getSensorCfgByLegacySourceId(sourceId);
        const legacy = bs2CfgToLegacyMcpShape(cfg, sourceId);
        return {
          ok: true,
          requestId,
          sourceId,
          sensorState: legacy.enabled ? "started" : "stopped",
          config: legacy,
          ack: legacy,
        };
      }
      catch (error: unknown)
      {
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, error: message };
      }
    },
  };
}
