import type { Bs2BrokerSession } from "../../bitstream2/bridge/bs2-broker-session";
import { dispatchBrokerFanOutAfterMcpRunCommand } from "./mcpBrokerFanOut.js";
import { BitstreamCommandApi } from "./bitstreamCommandApi";
import type { BitstreamCommandEnvelope, BitstreamCommandType } from "./bitstreamCommandTypes";

export interface BitstreamMcpAdapterInput {
  command?: unknown;
  debugWire?: boolean;
}

export interface BitstreamMcpAdapterOutput {
  ok: boolean;
  supportedCommands: BitstreamCommandType[];
  envelope: BitstreamCommandEnvelope | BitstreamMcpErrorEnvelope;
  debug?: {
    normalizedCommand: unknown;
    predictedPayloadHex?: string;
  };
}

export interface BitstreamMcpErrorEnvelope {
  ok: false;
  type: string;
  errorCode: string;
  timestamp: string;
  retryable: boolean;
  recommendedBackoffMs?: number;
  error: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function tryParseJsonObject(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return isObject(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (lower === "true") {
      return true;
    }
    if (lower === "false") {
      return false;
    }
  }
  return undefined;
}

function normalizeSensorSourceId(value: unknown): number {
  const parsed = toNumber(value);
  if (parsed === 1 || parsed === 2 || parsed === 3 || parsed === 4) {
    return parsed;
  }
  // Dummy source id (0) is intentionally excluded for MCP/backend operations.
  return 1;
}

function normalizeByCommandType(command: Record<string, unknown>): Record<string, unknown> {
  const type = typeof command.type === "string" ? command.type : "";
  const payload = isObject(command.payload) ? command.payload : {};
  const requestIdFromAny =
    (typeof payload.requestId === "string" && payload.requestId) ||
    (typeof command.requestId === "string" && command.requestId) ||
    `${type || "bitstream-cmd"}-${Date.now()}`;

  if (type === "diag.stream.start") {
    if (!isObject(payload.options)) {
      const diagMajor = toNumber(payload.diagMajor ?? command.diagMajor);
      const diagMinor = toNumber(payload.diagMinor ?? command.diagMinor);
      const globalPeriodMs = toNumber(payload.globalPeriodMs ?? command.globalPeriodMs);
      const taskPeriodMs = toNumber(payload.taskPeriodMs ?? command.taskPeriodMs);
      return {
        ...command,
        payload: {
          ...payload,
          requestId: requestIdFromAny,
          options: {
            diagMajor: diagMajor ?? 1,
            diagMinor: diagMinor ?? 0,
            globalPeriodMs: globalPeriodMs ?? 500,
            taskPeriodMs: taskPeriodMs ?? 500,
          },
        },
      };
    }
  }

  if (type === "sensor.cfg.set") {
    const existing = isObject(payload.options) ? payload.options : {};
    const sourceId = normalizeSensorSourceId(
      existing.sourceId ?? payload.sourceId ?? command.sourceId,
    );
    const enabled = toBoolean(existing.enabled ?? payload.enabled ?? command.enabled);
    const publishMode = toNumber(existing.publishMode ?? payload.publishMode ?? command.publishMode);
    const samplingIntervalMs = toNumber(
      existing.samplingIntervalMs ?? payload.samplingIntervalMs ?? command.samplingIntervalMs,
    );
    const deltaX100 = toNumber(existing.deltaX100 ?? payload.deltaX100 ?? command.deltaX100);
    const minPublishIntervalMs = toNumber(
      existing.minPublishIntervalMs ?? payload.minPublishIntervalMs ?? command.minPublishIntervalMs,
    );
    return {
      ...command,
      payload: {
        ...payload,
        requestId: requestIdFromAny,
        options: {
          sourceId,
          enabled: enabled ?? true,
          publishMode: publishMode ?? 1,
          samplingIntervalMs: samplingIntervalMs ?? 200,
          deltaX100: deltaX100 ?? 0,
          minPublishIntervalMs: minPublishIntervalMs ?? 0,
        },
      },
    };
  }

  if (type === "sensor.cfg.get") {
    const sourceId = normalizeSensorSourceId(payload.sourceId ?? command.sourceId);
    return {
      ...command,
      payload: {
        ...payload,
        requestId: requestIdFromAny,
        sourceId,
      },
    };
  }

  if (type === "handshake.run") {
    const protocolVersion = toNumber(payload.protocolVersion ?? command.protocolVersion);
    const pingNonce = toNumber(payload.pingNonce ?? command.pingNonce);
    const requestIdPrefix =
      (typeof payload.requestIdPrefix === "string" && payload.requestIdPrefix) ||
      (typeof command.requestIdPrefix === "string" && command.requestIdPrefix) ||
      undefined;
    return {
      ...command,
      payload: {
        ...payload,
        ...(requestIdPrefix ? { requestIdPrefix } : {}),
        ...(protocolVersion !== undefined ? { protocolVersion } : {}),
        ...(pingNonce !== undefined ? { pingNonce } : {}),
      },
    };
  }

  if (type === "sensor.bmi270.mode.set") {
    const payloadMode = toNumber(payload.mode);
    const commandMode = toNumber(command.mode);
    const rawFusionMode = payload.fusionMode ?? command.fusionMode;
    const rawImuMode = payload.imuMode ?? command.imuMode;
    const fusionMode = toBoolean(rawFusionMode);
    const imuMode = toNumber(rawImuMode);
    const normalizedMode =
      payloadMode ??
      commandMode ??
      (typeof imuMode === "number" ? imuMode : undefined) ??
      (fusionMode === true ? 1 : fusionMode === false ? 0 : undefined) ??
      1;
    return {
      ...command,
      payload: {
        ...payload,
        requestId: requestIdFromAny,
        mode: normalizedMode,
      },
    };
  }

  if (type === "sensor.bmi270.mode.get") {
    return {
      ...command,
      payload: {
        ...payload,
        requestId: requestIdFromAny,
      },
    };
  }

  if (type === "sensor.reinit") {
    return {
      ...command,
      payload: {
        ...payload,
        requestId: requestIdFromAny,
      },
    };
  }

  if (type === "sensor.bmi270.fusion.feed.set") {
    const intervalMs = toNumber(payload.intervalMs ?? command.intervalMs) ?? 10;
    return {
      ...command,
      payload: {
        ...payload,
        requestId: requestIdFromAny,
        intervalMs: Math.max(10, Math.min(100, Math.round(intervalMs))),
      },
    };
  }

  if (type === "sensor.bmi270.fusion.feed.get") {
    return {
      ...command,
      payload: {
        ...payload,
        requestId: requestIdFromAny,
      },
    };
  }

  if (type === "diag.task.priority.set") {
    if (!isObject(payload.options)) {
      const diagMajor = toNumber(payload.diagMajor ?? command.diagMajor);
      const diagMinor = toNumber(payload.diagMinor ?? command.diagMinor);
      const taskId = toNumber(payload.taskId ?? command.taskId);
      const newPriority = toNumber(payload.newPriority ?? command.newPriority);
      const requestId = toNumber(payload.requestId ?? command.innerRequestId ?? command.fwRequestId);
      return {
        ...command,
        payload: {
          ...payload,
          requestId: requestIdFromAny,
          options: {
            diagMajor: diagMajor ?? 1,
            diagMinor: diagMinor ?? 0,
            taskId: taskId ?? 0,
            newPriority: newPriority ?? 1,
            requestId: requestId ?? 1,
          },
        },
      };
    }
  }

  if (type === "diag.stream.stop" || type === "diag.snapshot.get" || type === "diag.task.table.get") {
    const diagMajor = toNumber(payload.diagMajor ?? command.diagMajor);
    const diagMinor = toNumber(payload.diagMinor ?? command.diagMinor);
    return {
      ...command,
      payload: {
        ...payload,
        requestId: requestIdFromAny,
        diagMajor: diagMajor ?? 1,
        diagMinor: diagMinor ?? 0,
      },
    };
  }

  return command;
}

function normalizeCommandInput(rawArgs: unknown): unknown {
  if (!isObject(rawArgs)) {
    return rawArgs;
  }

  if (isObject(rawArgs.command)) {
    const payload =
      typeof rawArgs.command.payload === "string"
        ? (tryParseJsonObject(rawArgs.command.payload) ?? rawArgs.command.payload)
        : rawArgs.command.payload;
    const normalized = {
      ...rawArgs.command,
      payload,
    };
    return normalizeByCommandType(normalized);
  }

  if (typeof rawArgs.command === "string") {
    const payloadFromRaw =
      typeof rawArgs.payload === "string"
        ? (tryParseJsonObject(rawArgs.payload) ?? rawArgs.payload)
        : rawArgs.payload;
    const normalized = {
      ...rawArgs,
      type: rawArgs.command,
      payload: payloadFromRaw ?? {},
    };
    return normalizeByCommandType(normalized);
  }

  const directPayload =
    typeof rawArgs.payload === "string" ? (tryParseJsonObject(rawArgs.payload) ?? rawArgs.payload) : rawArgs.payload;
  if (typeof rawArgs.type === "string") {
    const normalized = {
      ...rawArgs,
      payload: directPayload ?? {},
    };
    return normalizeByCommandType(normalized);
  }

  return rawArgs;
}

function toHex(payload: Uint8Array): string {
  return Array.from(payload)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(" ");
}

function predictPayloadHex(command: unknown): string | undefined {
  if (!isObject(command) || typeof command.type !== "string") {
    return undefined;
  }
  const payload = isObject(command.payload) ? command.payload : {};
  const type = command.type;

  if (type === "diag.snapshot.get" || type === "diag.task.table.get" || type === "diag.stream.stop") {
    const diagMajor = toNumber(payload.diagMajor) ?? 1;
    const diagMinor = toNumber(payload.diagMinor) ?? 0;
    return toHex(Uint8Array.of(diagMajor & 0xff, diagMinor & 0xff));
  }

  if (type === "diag.stream.start") {
    const options = isObject(payload.options) ? payload.options : {};
    const diagMajor = toNumber(options.diagMajor) ?? 1;
    const diagMinor = toNumber(options.diagMinor) ?? 0;
    const globalPeriodMs = toNumber(options.globalPeriodMs) ?? 500;
    const taskPeriodMs = toNumber(options.taskPeriodMs) ?? 500;
    const bytes = new Uint8Array(6);
    const view = new DataView(bytes.buffer);
    bytes[0] = diagMajor & 0xff;
    bytes[1] = diagMinor & 0xff;
    view.setUint16(2, globalPeriodMs & 0xffff, true);
    view.setUint16(4, taskPeriodMs & 0xffff, true);
    return toHex(bytes);
  }

  if (type === "diag.task.priority.set") {
    const options = isObject(payload.options) ? payload.options : {};
    const diagMajor = toNumber(options.diagMajor) ?? 1;
    const diagMinor = toNumber(options.diagMinor) ?? 0;
    const taskId = toNumber(options.taskId) ?? 0;
    const newPriority = toNumber(options.newPriority) ?? 1;
    const requestId = toNumber(options.requestId) ?? 1;
    const bytes = new Uint8Array(7);
    const view = new DataView(bytes.buffer);
    bytes[0] = diagMajor & 0xff;
    bytes[1] = diagMinor & 0xff;
    view.setUint16(2, taskId & 0xffff, true);
    bytes[4] = newPriority & 0xff;
    view.setUint16(5, requestId & 0xffff, true);
    return toHex(bytes);
  }

  if (type === "sensor.bmi270.mode.set") {
    const mode = toNumber(payload.mode) ?? 1;
    return toHex(Uint8Array.of(mode & 0xff));
  }

  if (type === "sensor.bmi270.mode.get") {
    return toHex(new Uint8Array(0));
  }

  if (type === "sensor.bmi270.fusion.feed.set") {
    const intervalMs = toNumber(payload.intervalMs) ?? 10;
    const clamped = Math.max(10, Math.min(100, Math.round(intervalMs)));
    const bytes = new Uint8Array(2);
    const view = new DataView(bytes.buffer);
    view.setUint16(0, clamped & 0xffff, true);
    return toHex(bytes);
  }

  if (type === "sensor.bmi270.fusion.feed.get") {
    return toHex(new Uint8Array(0));
  }

  return undefined;
}

export async function runBitstreamCommandFromMcp(
  getSession: () => Bs2BrokerSession | null,
  rawArgs: unknown,
): Promise<BitstreamMcpAdapterOutput> {
  const api = new BitstreamCommandApi({ getSession });
  const args = (rawArgs ?? {}) as BitstreamMcpAdapterInput;
  const normalized = normalizeCommandInput(args.command !== undefined ? { command: args.command } : rawArgs);
  const envelope = await api.executeRaw(normalized);
  if (envelope.ok) {
    const session = getSession();
    if (session) {
      await dispatchBrokerFanOutAfterMcpRunCommand(session, api, normalized, envelope);
    }
  }
  const debugWire = isObject(rawArgs) && rawArgs.debugWire === true;
  return {
    ok: envelope.ok,
    supportedCommands: api.listSupportedCommands(),
    envelope,
    ...(debugWire
      ? {
          debug: {
            normalizedCommand: normalized,
            predictedPayloadHex: predictPayloadHex(normalized),
          },
        }
      : {}),
  };
}
