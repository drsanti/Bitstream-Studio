import { bs2CfgToLegacyMcpShape } from "../../../bitstream2/bridge/bs2-mcp-config-shape";
import type { BitstreamMcpRuntimeContext, BitstreamMcpToolRegistration } from "../types";

const SENSOR_STATUS_GET_INPUT_SCHEMA = {
  type: "object",
  properties: {
    sourceIds: {
      type: "array",
      items: { type: ["number", "string"] },
    },
    requestIdPrefix: { type: "string" },
  },
  additionalProperties: true,
} as const;

interface SensorStatusGetArgs {
  sourceIds?: Array<number | string>;
  requestIdPrefix?: string;
}

const DEFAULT_SOURCE_IDS = [1, 2, 3, 4];
const SOURCE_HINT_BY_ID: Record<number, "sht40" | "dps368" | "bmm350" | "bmi270" | "unknown"> = {
  1: "sht40",
  2: "dps368",
  3: "bmm350",
  4: "bmi270",
};

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

function normalizeSourceIds(rawSourceIds: unknown): number[] {
  if (!Array.isArray(rawSourceIds) || rawSourceIds.length === 0) {
    return [...DEFAULT_SOURCE_IDS];
  }

  const normalized = rawSourceIds
    .map((value) => toNumber(value))
    .filter((value): value is number => value !== null)
    .map((value) => Math.trunc(value))
    .filter((value) => value > 0 && value <= 255);

  return Array.from(new Set(normalized));
}

export function createSensorStatusGetTool(runtime: BitstreamMcpRuntimeContext): BitstreamMcpToolRegistration {
  return {
    name: "bitstream_sensor_status_get",
    description: "Read sensor start/stop status and config for one or more sensor sourceIds.",
    inputSchema: SENSOR_STATUS_GET_INPUT_SCHEMA,
    handler: async (args: unknown) => {
      const session = runtime.getSession();
      if (!session) {
        return {
          ok: false,
          error: "Bitstream session not available",
        };
      }

      const typedArgs = (args ?? {}) as Partial<SensorStatusGetArgs>;
      const sourceIds = normalizeSourceIds(typedArgs.sourceIds);
      if (sourceIds.length === 0) {
        return { ok: false, error: "sourceIds must contain at least one valid sensor sourceId (1-255)" };
      }

      const requestIdPrefix = typedArgs.requestIdPrefix ?? "sensor-status";

      const sensors = await Promise.all(
        sourceIds.map(async (sourceId) => {
          const requestId = `${requestIdPrefix}-${sourceId}-${Date.now()}`;
          try {
            const cfg = await session.getSensorCfgByLegacySourceId(sourceId);
            const legacy = bs2CfgToLegacyMcpShape(cfg, sourceId);
            return {
              sourceId,
              sourceHint: SOURCE_HINT_BY_ID[sourceId] ?? "unknown",
              ok: true,
              sensorState: legacy.enabled ? "started" : "stopped",
              config: {
                enabled: legacy.enabled,
                publishMode: legacy.publishMode,
                samplingIntervalMs: legacy.samplingIntervalMs,
                deltaX100: legacy.deltaX100,
                minPublishIntervalMs: legacy.minPublishIntervalMs,
                publishIntervalMs: legacy.publishIntervalMs,
              },
              ack: legacy,
            };
          } catch (error: unknown) {
            return {
              sourceId,
              sourceHint: SOURCE_HINT_BY_ID[sourceId] ?? "unknown",
              ok: false,
              sensorState: "unknown",
              error: error instanceof Error ? error.message : String(error),
            };
          }
        }),
      );

      return {
        ok: true,
        sourceIds,
        sensors,
      };
    },
  };
}
