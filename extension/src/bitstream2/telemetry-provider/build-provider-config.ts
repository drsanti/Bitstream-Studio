import { BMI270_MASK } from "../domains/sensors/bmi270";
import { BMM350_MASK } from "../domains/sensors/bmm350";
import { DPS368_MASK } from "../domains/sensors/dps368";
import { SHT40_MASK } from "../domains/sensors/sht40";
import type { Bs2SensorConfig } from "../domains/config/sensor-config";
import { effectivePublishIntervalMs } from "../domains/config/sensor-config";
import { publishModeLabel } from "./catalog/firmware-limits";
import {
  SENSOR_CATALOG_ENTRIES,
  sensorCatalogEntryBySensorId,
} from "./catalog/sensor-catalog-source";
import type { BitstreamTelemetrySensorCatalogEntry } from "./types";

export type BitstreamTelemetryProviderConfigSource = "firmware" | "simulator" | "draft";

export type BitstreamTelemetryProviderSensorConfigRow = {
  enabled: boolean;
  publishMode: string;
  mask: number;
  maskLabels: string[];
  samplingIntervalMs: number;
  publishIntervalMs: number;
  deltaX100: number;
  minPublishIntervalMs: number;
  expectedRateHz: number;
};

export type BitstreamTelemetryProviderConfigPayload = {
  hostMs: number;
  source: BitstreamTelemetryProviderConfigSource;
  sensors: Record<string, BitstreamTelemetryProviderSensorConfigRow>;
};

function rowFromCfg(
  entry: BitstreamTelemetrySensorCatalogEntry,
  cfg: Pick<
    Bs2SensorConfig,
    | "enabled"
    | "publishMode"
    | "mask"
    | "samplingIntervalMs"
    | "publishIntervalMs"
    | "deltaX100"
    | "minPublishIntervalMs"
  >,
): BitstreamTelemetryProviderSensorConfigRow {
  const mask = cfg.mask & 0xff;
  const publishIntervalMs = cfg.publishIntervalMs;
  const samplingIntervalMs = cfg.samplingIntervalMs;
  return {
    enabled: cfg.enabled,
    publishMode: publishModeLabel(cfg.publishMode),
    mask,
    maskLabels: maskLabelsForSensor(entry, mask),
    samplingIntervalMs,
    publishIntervalMs,
    deltaX100: cfg.deltaX100,
    minPublishIntervalMs: cfg.minPublishIntervalMs,
    expectedRateHz: expectedRateHz(publishIntervalMs, samplingIntervalMs),
  };
}

export function maskLabelsForSensor(entry: BitstreamTelemetrySensorCatalogEntry, mask: number): string[] {
  const labels: string[] = [];
  const m = mask & 0xff;

  if (entry.id === "bmi270") {
    if ((m & BMI270_MASK.ACC) !== 0) labels.push("accelX", "accelY", "accelZ");
    if ((m & BMI270_MASK.GYR) !== 0) labels.push("gyroX", "gyroY", "gyroZ");
    if ((m & BMI270_MASK.TMP) !== 0) labels.push("temperatureC");
    if ((m & BMI270_MASK.EULER) !== 0) labels.push("headingRad", "pitchRad", "rollRad");
    if ((m & BMI270_MASK.QUAT) !== 0) labels.push("quatW", "quatX", "quatY", "quatZ");
    return labels;
  }

  if (entry.id === "bmm350") {
    if ((m & BMM350_MASK.MAG) !== 0) labels.push("magX", "magY", "magZ");
    if ((m & BMM350_MASK.TMP) !== 0) labels.push("temperatureC");
    return labels;
  }

  if (entry.id === "sht40") {
    if ((m & SHT40_MASK.TEMP) !== 0) labels.push("temperatureC");
    if ((m & SHT40_MASK.HUM) !== 0) labels.push("humidityPct");
    return labels;
  }

  if (entry.id === "dps368") {
    if ((m & DPS368_MASK.PRESS) !== 0) labels.push("pressureHpa");
    if ((m & DPS368_MASK.TMP) !== 0) labels.push("temperatureC");
    return labels;
  }

  for (const ch of entry.maskChannels) {
    if ((m & ch.bit) !== 0) {
      labels.push(ch.key);
    }
  }
  return labels;
}

function expectedRateHz(publishIntervalMs: number, samplingIntervalMs: number): number {
  const intervalMs =
    publishIntervalMs > 0 ? publishIntervalMs : samplingIntervalMs > 0 ? samplingIntervalMs : 0;
  if (intervalMs <= 0) {
    return 0;
  }
  return Math.round((1000 / intervalMs) * 10) / 10;
}

/** Build a push-on-change config snapshot from catalog defaults. */
export function buildProviderConfigPayload(
  source: BitstreamTelemetryProviderConfigSource = "simulator",
  hostMs: number = Date.now(),
): BitstreamTelemetryProviderConfigPayload {
  const sensors: Record<string, BitstreamTelemetryProviderSensorConfigRow> = {};

  for (const entry of SENSOR_CATALOG_ENTRIES) {
    const defaults = entry.defaults;
    sensors[entry.id] = rowFromCfg(entry, {
      enabled: Boolean(defaults.enabled),
      publishMode:
        defaults.publishMode === "on_change" ? 1 : defaults.publishMode === "hybrid" ? 2 : 0,
      mask: Number(defaults.mask ?? 0),
      samplingIntervalMs: Number(defaults.samplingIntervalMs ?? 0),
      publishIntervalMs: Number(defaults.publishIntervalMs ?? 0),
      deltaX100: Number(defaults.deltaX100 ?? 0),
      minPublishIntervalMs: Number(defaults.minPublishIntervalMs ?? 0),
    });
  }

  return { hostMs, source, sensors };
}

/** Merge live BS2 SENSOR_CFG rows over catalog defaults for `bitstream:config`. */
export function buildProviderConfigFromBs2Configs(
  configs: readonly Bs2SensorConfig[],
  source: BitstreamTelemetryProviderConfigSource,
  hostMs: number = Date.now(),
): BitstreamTelemetryProviderConfigPayload {
  const base = buildProviderConfigPayload(source, hostMs);
  for (const cfg of configs) {
    const entry = sensorCatalogEntryBySensorId(cfg.sensorId);
    if (entry == null) {
      continue;
    }
    base.sensors[entry.id] = rowFromCfg(entry, cfg);
  }
  return base;
}

export function bs2SensorConfigToProviderRow(sensorId: number, cfg: Bs2SensorConfig) {
  const entry = sensorCatalogEntryBySensorId(sensorId);
  if (entry == null) {
    return null;
  }
  return {
    sensor: entry.id,
    ...rowFromCfg(entry, cfg),
    sensorId,
    publishIntervalEffectiveMs: effectivePublishIntervalMs(cfg),
  };
}
