/*******************************************************************************
 * File Name : sensor-cfg-access-policy.ts
 *
 * Description : Host-side guidance when SENSOR_CFG GET/SET contends with high-rate
 *               EVT_SENSOR on UART MCU (operational policy; see SENSOR_CFG_V2.md §11).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { effectivePublishIntervalMs, type Bs2SensorConfig } from "./sensor-config";

/** Per-sensor sampling at or below this period (ms) is treated as high UART load. */
export const CFG_ACCESS_HIGH_LOAD_SAMPLE_MS = 100;

/**
 * When quieting the bus before cfg RPCs, disable other sensors or set sampling to at
 * least this period (ms). Matches UART behavior harness `quietAllSensors` settle path.
 */
export const CFG_ACCESS_QUIET_MIN_SAMPLE_MS = 500;

/** Default REQ timeout for SENSOR_CFG SET/GET when the bus is relatively idle. */
export const CFG_ACCESS_SET_TIMEOUT_MS = 2500;

/** REQ timeout when applying cfg without quieting a busy multi-sensor stream. */
export const CFG_ACCESS_SET_TIMEOUT_UNDER_LOAD_MS = 10_000;

/** Post-SET settle before measuring EVT (UART test harness default). */
export const CFG_ACCESS_POST_SET_SETTLE_MS = 600;

/** Hint copy for Sensor Studio / cfg panels (English). */
export const CFG_ACCESS_UI_HINT =
  "At high sampling rates the MCU UART path may be busy. Disable unused sensors or lower rates before Apply; retry GET/SET if the request times out.";

export type CfgAccessLoadSummary = {
  enabledCount: number;
  aggregateTelemetryHz: number;
  highLoad: boolean;
};

/** Sum of enabled sensors' effective telemetry rates (upper-bound estimate). */
export function summarizeCfgAccessLoad(
  configs: readonly Pick<Bs2SensorConfig, "enabled" | "samplingIntervalMs" | "publishIntervalMs">[],
): CfgAccessLoadSummary {
  let aggregateTelemetryHz = 0;
  let enabledCount = 0;
  let highLoad = false;

  for (const cfg of configs)
  {
    if (!cfg.enabled)
    {
      continue;
    }
    enabledCount++;
    const publishMs = effectivePublishIntervalMs(cfg);
    if (publishMs > 0)
    {
      aggregateTelemetryHz += 1000 / publishMs;
    }
    if (cfg.samplingIntervalMs > 0 && cfg.samplingIntervalMs <= CFG_ACCESS_HIGH_LOAD_SAMPLE_MS)
    {
      highLoad = true;
    }
  }

  if (enabledCount >= 3 && aggregateTelemetryHz >= 80)
  {
    highLoad = true;
  }

  return { enabledCount, aggregateTelemetryHz, highLoad };
}

/** True when hosts should quiet the bus or extend REQ timeout before cfg RPCs. */
export function isHighTelemetryLoadForCfgAccess(
  configs: readonly Pick<Bs2SensorConfig, "enabled" | "samplingIntervalMs" | "publishIntervalMs">[],
): boolean {
  return summarizeCfgAccessLoad(configs).highLoad;
}

/** REQ timeout (ms) for SENSOR_CFG SET/GET given current load estimate. */
export function cfgAccessSetTimeoutMs(
  configs: readonly Pick<Bs2SensorConfig, "enabled" | "samplingIntervalMs" | "publishIntervalMs">[],
): number {
  return isHighTelemetryLoadForCfgAccess(configs)
    ? CFG_ACCESS_SET_TIMEOUT_UNDER_LOAD_MS
    : CFG_ACCESS_SET_TIMEOUT_MS;
}
