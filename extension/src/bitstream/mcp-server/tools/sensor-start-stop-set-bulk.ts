import type { BitstreamMcpRuntimeContext, BitstreamMcpToolRegistration } from "../types";
import {
  applySensorStartStop,
  coerceEnabledBoolean,
  type SensorStartStopApplyResult,
} from "./sensor-start-stop-set";

const DEFAULT_SOURCE_IDS = [1, 2, 3, 4];

const SENSOR_START_STOP_SET_BULK_INPUT_SCHEMA = {
  type: "object",
  properties: {
    enabled: {
      anyOf: [
        { type: "boolean" },
        { type: "string", enum: ["true", "false", "True", "False", "TRUE", "FALSE"] },
        { type: "integer", enum: [0, 1] },
      ],
    },
    sourceIds: {
      type: "array",
      items: { type: ["number", "string"] },
    },
    requestIdPrefix: { type: "string" },
  },
  required: ["enabled"],
  additionalProperties: true,
} as const;

interface SensorStartStopSetBulkArgs {
  enabled: unknown;
  sourceIds?: Array<number | string>;
  requestIdPrefix?: string;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeSourceIds(raw: unknown): number[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [...DEFAULT_SOURCE_IDS];
  }
  const normalized = raw
    .map((value) => toNumber(value))
    .filter((value): value is number => value !== null)
    .map((value) => Math.trunc(value))
    .filter((value) => value > 0 && value <= 255);
  const unique = Array.from(new Set(normalized));
  return unique.length > 0 ? unique : [...DEFAULT_SOURCE_IDS];
}

export function createSensorStartStopSetBulkTool(runtime: BitstreamMcpRuntimeContext): BitstreamMcpToolRegistration {
  return {
    name: "bitstream_sensor_start_stop_set_bulk",
    description:
      "Start/stop multiple sensors in one tool call (default sourceIds 1–4: SHT40, DPS368, BMM350, BMI270). Preserves each source's publish mode and timing fields. Use this instead of four separate bitstream_sensor_start_stop_set calls.",
    inputSchema: SENSOR_START_STOP_SET_BULK_INPUT_SCHEMA,
    handler: async (args: unknown) => {
      const session = runtime.getSession();
      if (!session) {
        return {
          ok: false,
          error: "Bitstream session not available",
        };
      }

      const typedArgs = (args ?? {}) as Partial<SensorStartStopSetBulkArgs>;
      const enabled = coerceEnabledBoolean(typedArgs.enabled);
      if (enabled === null) {
        return {
          ok: false,
          error:
            "enabled is required — use boolean true/false, or string \"true\"/\"false\", or 0/1",
        };
      }

      const sourceIds = normalizeSourceIds(typedArgs.sourceIds);
      const requestIdPrefix = typedArgs.requestIdPrefix ?? "sensor-start-stop-bulk";

      const results: Array<
        | { sourceId: number; ok: true; data: SensorStartStopApplyResult }
        | { sourceId: number; ok: false; error: string }
      > = [];

      for (const sourceId of sourceIds) {
        try {
          const data = await applySensorStartStop(session, sourceId, enabled, `${requestIdPrefix}-${sourceId}`);
          results.push({ sourceId, ok: true, data });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          results.push({ sourceId, ok: false, error: message });
        }
      }

      const allOk = results.every((r) => r.ok);
      return {
        ok: allOk,
        enabled,
        sourceIds,
        summary: {
          total: results.length,
          succeeded: results.filter((r) => r.ok).length,
          failed: results.filter((r) => !r.ok).length,
        },
        results,
      };
    },
  };
}
