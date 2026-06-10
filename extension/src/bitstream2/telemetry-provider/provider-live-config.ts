import { BS2_CMD } from "../domains/config/commands";
import {
  decodeSensorCfgBody,
  encodeSensorCfgGetBody,
  type Bs2SensorConfig,
} from "../domains/config/sensor-config";
import { bytesToBase64, base64ToBytes } from "../util/base64";
import { SENSOR_CATALOG_ENTRIES } from "./catalog/sensor-catalog-source";
import type { ProviderCommandService } from "./provider-command-service";

/** Best-effort SENSOR_CFG_GET for each catalog sensor (UART / simulator REQ path). */
export async function fetchLiveSensorConfigs(
  service: ProviderCommandService,
): Promise<Bs2SensorConfig[]> {
  const configs: Bs2SensorConfig[] = [];
  for (const entry of SENSOR_CATALOG_ENTRIES) {
    try {
      const res = await service.sendReq({
        cmdId: BS2_CMD.SENSOR_CFG_GET,
        reqId: 40 + entry.sensorId,
        bodyB64: bytesToBase64(encodeSensorCfgGetBody(entry.sensorId)),
        timeoutMs: 2500,
      });
      if (!res.ok || res.bodyB64 == null) {
        continue;
      }
      const cfg = decodeSensorCfgBody(base64ToBytes(res.bodyB64));
      if (cfg != null) {
        configs.push(cfg);
      }
    } catch {
      // Simulator-only sessions may not answer UART REQ until linked.
    }
  }
  return configs;
}

export function devSimConfigsToBs2(
  rows: Array<{
    sensorId: number;
    enabled: boolean;
    publishMode: number;
    mask: number;
    samplingIntervalMs: number;
    publishIntervalMs: number;
    deltaX100: number;
    minPublishIntervalMs: number;
  }>,
): Bs2SensorConfig[] {
  return rows.map((c) => ({
    sensorId: c.sensorId,
    enabled: c.enabled,
    publishMode: (c.publishMode <= 2 ? c.publishMode : 0) as Bs2SensorConfig["publishMode"],
    mask: c.mask,
    samplingIntervalMs: c.samplingIntervalMs,
    publishIntervalMs: c.publishIntervalMs,
    deltaX100: c.deltaX100,
    minPublishIntervalMs: c.minPublishIntervalMs,
  }));
}
