import type { Bitstream2HostResPayload } from "../bridge/protocol";
import { BS2_CMD } from "../domains/config/commands";
import {
  decodeSensorCfgBody,
  encodeSensorCfgBody,
  encodeSensorCfgGetBody,
  normalizeSensorCfg,
  type Bs2SensorConfig,
} from "../domains/config/sensor-config";
import {
  bmi270StreamModeCodeToUi,
  bmi270StreamModeUiToCode,
  decodeBmi270ModeResBody,
  encodeBmi270ModeSetBody,
} from "../domains/bmi270/bmi270-control";
import { publishModeCode, type Bs2PublishModeLabel } from "./catalog/firmware-limits";
import {
  sensorCatalogEntryById,
  sensorCatalogEntryBySensorId,
} from "./catalog/sensor-catalog-source";
import { bs2SensorConfigToProviderRow } from "./build-provider-config";
import type { ProviderCommandService } from "./provider-command-service";
import { bytesToBase64, base64ToBytes } from "../util/base64";

export const PROVIDER_COMMAND_ALLOWLIST = [
  "ping",
  "caps.get",
  "sensor.cfg.get",
  "sensor.cfg.set",
  "bmi270.mode.get",
  "bmi270.mode.set",
] as const;

export type ProviderCommandName = (typeof PROVIDER_COMMAND_ALLOWLIST)[number];

export type ProviderCommandArgs = Record<string, unknown>;

export type ProviderCommandResult = {
  ok: boolean;
  command: string;
  data: unknown;
  error: string | null;
  hostMs: number;
};

function resolveSensorId(args: ProviderCommandArgs): number | null {
  if (typeof args.sensorId === "number" && Number.isFinite(args.sensorId)) {
    return Math.trunc(args.sensorId);
  }
  if (typeof args.sensor === "string") {
    const entry = sensorCatalogEntryById(args.sensor);
    return entry?.sensorId ?? null;
  }
  return null;
}

function parsePublishMode(raw: unknown): 0 | 1 | 2 | null {
  if (typeof raw === "number" && raw >= 0 && raw <= 2) {
    return raw as 0 | 1 | 2;
  }
  if (typeof raw === "string") {
    const labels: Bs2PublishModeLabel[] = ["periodic", "on_change", "hybrid"];
    if (labels.includes(raw as Bs2PublishModeLabel)) {
      return publishModeCode(raw as Bs2PublishModeLabel);
    }
  }
  return null;
}

function cfgFromSetArgs(sensorId: number, args: ProviderCommandArgs): Bs2SensorConfig | null {
  const entry = sensorCatalogEntryBySensorId(sensorId);
  if (entry == null) {
    return null;
  }
  const defaults = entry.defaults;
  const publishMode = parsePublishMode(args.publishMode ?? defaults.publishMode);
  if (publishMode == null) {
    return null;
  }
  return normalizeSensorCfg({
    sensorId,
    enabled: typeof args.enabled === "boolean" ? args.enabled : Boolean(defaults.enabled),
    publishMode,
    mask: typeof args.mask === "number" ? args.mask : Number(defaults.mask ?? 0),
    samplingIntervalMs:
      typeof args.samplingIntervalMs === "number"
        ? args.samplingIntervalMs
        : Number(defaults.samplingIntervalMs ?? 0),
    publishIntervalMs:
      typeof args.publishIntervalMs === "number"
        ? args.publishIntervalMs
        : Number(defaults.publishIntervalMs ?? 0),
    deltaX100:
      typeof args.deltaX100 === "number" ? args.deltaX100 : Number(defaults.deltaX100 ?? 0),
    minPublishIntervalMs:
      typeof args.minPublishIntervalMs === "number"
        ? args.minPublishIntervalMs
        : Number(defaults.minPublishIntervalMs ?? 0),
  });
}

function resBodyBytes(res: Bitstream2HostResPayload): Uint8Array | null {
  if (res.bodyB64 == null) {
    return null;
  }
  return base64ToBytes(res.bodyB64);
}

export async function executeProviderCommand(
  service: ProviderCommandService,
  command: string,
  args: ProviderCommandArgs,
): Promise<ProviderCommandResult> {
  const hostMs = Date.now();
  if (!PROVIDER_COMMAND_ALLOWLIST.includes(command as ProviderCommandName)) {
    return {
      ok: false,
      command,
      data: null,
      error: `command not allowlisted: ${command}`,
      hostMs,
    };
  }

  try {
    switch (command as ProviderCommandName) {
      case "ping": {
        const res = await service.sendReq({ cmdId: BS2_CMD.PING, reqId: 1 });
        return {
          ok: res.ok,
          command,
          data: { status: res.status ?? 0 },
          error: res.ok ? null : (res.error ?? "ping failed"),
          hostMs,
        };
      }
      case "caps.get": {
        const res = await service.sendReq({ cmdId: BS2_CMD.CAPS_GET, reqId: 2 });
        const body = resBodyBytes(res);
        return {
          ok: res.ok,
          command,
          data: body != null ? { capsBytes: body.length, bodyB64: res.bodyB64 } : null,
          error: res.ok ? null : (res.error ?? "caps.get failed"),
          hostMs,
        };
      }
      case "sensor.cfg.get": {
        const sensorId = resolveSensorId(args);
        if (sensorId == null) {
          return { ok: false, command, data: null, error: "sensorId or sensor required", hostMs };
        }
        const res = await service.sendReq({
          cmdId: BS2_CMD.SENSOR_CFG_GET,
          reqId: 40 + sensorId,
          bodyB64: bytesToBase64(encodeSensorCfgGetBody(sensorId)),
        });
        const body = resBodyBytes(res);
        const cfg = body != null ? decodeSensorCfgBody(body) : null;
        if (!res.ok || cfg == null) {
          return {
            ok: false,
            command,
            data: null,
            error: res.error ?? "sensor.cfg.get failed",
            hostMs,
          };
        }
        return {
          ok: true,
          command,
          data: bs2SensorConfigToProviderRow(sensorId, cfg),
          error: null,
          hostMs,
        };
      }
      case "sensor.cfg.set": {
        const sensorId = resolveSensorId(args);
        if (sensorId == null) {
          return { ok: false, command, data: null, error: "sensorId or sensor required", hostMs };
        }
        const cfg = cfgFromSetArgs(sensorId, args);
        if (cfg == null) {
          return { ok: false, command, data: null, error: "invalid sensor.cfg.set args", hostMs };
        }
        const res = await service.sendReq({
          cmdId: BS2_CMD.SENSOR_CFG_SET,
          reqId: 20 + sensorId,
          bodyB64: bytesToBase64(encodeSensorCfgBody(cfg)),
        });
        const body = resBodyBytes(res);
        const ack = body != null ? decodeSensorCfgBody(body) : null;
        if (!res.ok || ack == null) {
          return {
            ok: false,
            command,
            data: null,
            error: res.error ?? "sensor.cfg.set failed",
            hostMs,
          };
        }
        return {
          ok: true,
          command,
          data: bs2SensorConfigToProviderRow(sensorId, ack),
          error: null,
          hostMs,
        };
      }
      case "bmi270.mode.get": {
        const res = await service.sendReq({ cmdId: BS2_CMD.BMI270_MODE_GET, reqId: 71 });
        const body = resBodyBytes(res);
        const mode = body != null ? decodeBmi270ModeResBody(body) : null;
        if (!res.ok || mode == null) {
          return {
            ok: false,
            command,
            data: null,
            error: res.error ?? "bmi270.mode.get failed",
            hostMs,
          };
        }
        return {
          ok: true,
          command,
          data: { mode: bmi270StreamModeCodeToUi(mode) },
          error: null,
          hostMs,
        };
      }
      case "bmi270.mode.set": {
        const raw = args.mode;
        if (raw !== "raw" && raw !== "fusion" && raw !== "hybrid") {
          return { ok: false, command, data: null, error: "mode must be raw|fusion|hybrid", hostMs };
        }
        const res = await service.sendReq({
          cmdId: BS2_CMD.BMI270_MODE_SET,
          reqId: 70,
          bodyB64: bytesToBase64(encodeBmi270ModeSetBody(bmi270StreamModeUiToCode(raw))),
        });
        const body = resBodyBytes(res);
        const mode = body != null ? decodeBmi270ModeResBody(body) : null;
        if (!res.ok || mode == null) {
          return {
            ok: false,
            command,
            data: null,
            error: res.error ?? "bmi270.mode.set failed",
            hostMs,
          };
        }
        return {
          ok: true,
          command,
          data: { mode: bmi270StreamModeCodeToUi(mode) },
          error: null,
          hostMs,
        };
      }
      default:
        return { ok: false, command, data: null, error: "unhandled command", hostMs };
    }
  } catch (err) {
    return {
      ok: false,
      command,
      data: null,
      error: err instanceof Error ? err.message : String(err),
      hostMs,
    };
  }
}
