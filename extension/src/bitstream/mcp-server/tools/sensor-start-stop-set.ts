import { publishSensorCfgUpdatedFanOut } from "../../command-api/mcpBrokerFanOut.js";
import type { Bs2BrokerSession } from "../../../bitstream2/bridge/bs2-broker-session";
import { bs2CfgToLegacyMcpShape } from "../../../bitstream2/bridge/bs2-mcp-config-shape";
import type { BitstreamMcpRuntimeContext, BitstreamMcpToolRegistration } from "../types";

const ENABLED_JSON_SCHEMA = {
  anyOf: [
    { type: "boolean" },
    { type: "string", enum: ["true", "false", "True", "False", "TRUE", "FALSE"] },
    { type: "integer", enum: [0, 1] },
  ],
} as const;

const SENSOR_START_STOP_SET_INPUT_SCHEMA = {
  type: "object",
  properties: {
    sourceId: { type: ["number", "string"] },
    enabled: ENABLED_JSON_SCHEMA,
    requestIdPrefix: { type: "string" },
  },
  required: ["sourceId", "enabled"],
  additionalProperties: true,
} as const;

interface SensorStartStopSetArgs {
  sourceId: number | string;
  enabled: unknown;
  requestIdPrefix?: string;
}

/** Accept JSON booleans plus LLM/common string and 0/1 forms (MCP clients vary). */
export function coerceEnabledBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
    return null;
  }
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (lower === "true" || lower === "1" || lower === "yes" || lower === "on") {
      return true;
    }
    if (lower === "false" || lower === "0" || lower === "no" || lower === "off") {
      return false;
    }
  }
  return null;
}

export interface SensorStartStopApplyResult {
  ok: true;
  sourceId: number;
  requestedEnabled: boolean;
  sensorState: "started" | "stopped";
  before: {
    enabled: boolean;
    publishMode: number;
    samplingIntervalMs: number;
    deltaX100: number;
    minPublishIntervalMs: number;
  };
  after: {
    enabled: boolean;
    publishMode: number;
    samplingIntervalMs: number;
    deltaX100: number;
    minPublishIntervalMs: number;
  };
  setAck: unknown;
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

export async function applySensorStartStop(
  session: Bs2BrokerSession,
  sourceId: number,
  enabled: boolean,
  requestIdPrefix: string,
): Promise<SensorStartStopApplyResult>
{
  const currentCfg = await session.getSensorCfgByLegacySourceId(sourceId);
  const current = bs2CfgToLegacyMcpShape(currentCfg, sourceId);

  const setRequestId = `${requestIdPrefix}-set-${sourceId}-${Date.now()}`;
  const afterCfg = await session.setSensorCfgByLegacySourceId(sourceId, { enabled });
  const after = bs2CfgToLegacyMcpShape(afterCfg, sourceId);

  const verifyRequestId = `${requestIdPrefix}-verify-${sourceId}-${Date.now()}`;
  await publishSensorCfgUpdatedFanOut(
    session,
    {
      sourceId: after.sourceId,
      enabled: after.enabled,
      publishMode: after.publishMode,
      samplingIntervalMs: after.samplingIntervalMs,
      deltaX100: after.deltaX100,
      minPublishIntervalMs: after.minPublishIntervalMs,
      publishIntervalMs: after.publishIntervalMs ?? 0,
    },
    verifyRequestId,
  );

  return {
    ok: true,
    sourceId,
    requestedEnabled: enabled,
    sensorState: after.enabled ? "started" : "stopped",
    before: {
      enabled: current.enabled,
      publishMode: current.publishMode,
      samplingIntervalMs: current.samplingIntervalMs,
      deltaX100: current.deltaX100,
      minPublishIntervalMs: current.minPublishIntervalMs,
    },
    after: {
      enabled: after.enabled,
      publishMode: after.publishMode,
      samplingIntervalMs: after.samplingIntervalMs,
      deltaX100: after.deltaX100,
      minPublishIntervalMs: after.minPublishIntervalMs,
    },
    setAck: after,
  };
}

export function createSensorStartStopSetTool(runtime: BitstreamMcpRuntimeContext): BitstreamMcpToolRegistration {
  return {
    name: "bitstream_sensor_start_stop_set",
    description:
      "Start/stop one sensor by sourceId while preserving current sensor config fields. Prefer bitstream_sensor_start_stop_set_bulk to enable/disable all standard sensors (1–4) in one call.",
    inputSchema: SENSOR_START_STOP_SET_INPUT_SCHEMA,
    handler: async (args: unknown) => {
      const session = runtime.getSession();
      if (!session) {
        return {
          ok: false,
          error: "Bitstream session not available",
        };
      }

      const typedArgs = (args ?? {}) as Partial<SensorStartStopSetArgs>;
      const enabled = coerceEnabledBoolean(typedArgs.enabled);
      if (enabled === null) {
        return {
          ok: false,
          error:
            "enabled is required — use boolean true/false, or string \"true\"/\"false\", or 0/1",
        };
      }

      const sourceIdRaw = toNumber(typedArgs.sourceId);
      const sourceId = sourceIdRaw === null ? null : Math.trunc(sourceIdRaw);
      if (sourceId === null || sourceId <= 0 || sourceId > 255) {
        return { ok: false, error: "sourceId is required and must be a positive integer (1-255)" };
      }

      const requestIdPrefix = typedArgs.requestIdPrefix ?? "sensor-start-stop";
      try {
        return await applySensorStartStop(session, sourceId, enabled, requestIdPrefix);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, error: message };
      }
    },
  };
}
