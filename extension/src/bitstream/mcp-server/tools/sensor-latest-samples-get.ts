/*******************************************************************************
 * File Name : sensor-latest-samples-get.ts
 *
 * Description : Collect latest BS2 EVT_SENSOR samples over a short window.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { Bitstream2SensorSamplePayload } from "../../../bitstream2/bridge/protocol";
import type { BitstreamMcpRuntimeContext, BitstreamMcpToolRegistration } from "../types";

const SENSOR_LATEST_SAMPLES_INPUT_SCHEMA = {
  type: "object",
  properties: {
    windowMs: { type: "number" },
  },
  additionalProperties: true,
} as const;

interface SensorLatestSamplesArgs
{
  windowMs?: number;
}

type SensorKey = "sht40" | "dps368" | "bmm350" | "bmi270" | "unknown";
const ALLOWED_SENSOR_KEYS = new Set<SensorKey>(["sht40", "dps368", "bmm350", "bmi270", "unknown"]);

export function createSensorLatestSamplesGetTool(
  runtime: BitstreamMcpRuntimeContext,
): BitstreamMcpToolRegistration
{
  return {
    name: "bitstream_sensor_latest_samples_get",
    description: "Collect latest BS2 sensor samples for all sensors over a short window.",
    inputSchema: SENSOR_LATEST_SAMPLES_INPUT_SCHEMA,
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

      const typedArgs = (args ?? {}) as SensorLatestSamplesArgs;
      const windowMs = Number.isFinite(typedArgs.windowMs) ? Math.max(200, Number(typedArgs.windowMs)) : 1500;

      const byId = await session.collectLatestSamplesBySensorId(windowMs);
      const latest: Partial<Record<SensorKey, Bitstream2SensorSamplePayload>> = {};
      let frameCount = 0;

      for (const [sensorId, sample] of byId)
      {
        frameCount += 1;
        const key = session.sensorKeyFromBs2Id(sensorId);
        if (ALLOWED_SENSOR_KEYS.has(key))
        {
          latest[key] = sample;
        }
        else
        {
          latest.unknown = sample;
        }
      }

      return {
        ok: true,
        windowMs,
        frameCount: session.getSamples().length,
        latest,
      };
    },
  };
}
