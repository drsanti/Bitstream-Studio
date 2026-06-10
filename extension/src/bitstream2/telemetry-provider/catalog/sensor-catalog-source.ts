import { BMI270_MASK } from "../../domains/sensors/bmi270";
import { BMM350_MASK } from "../../domains/sensors/bmm350";
import { DPS368_MASK } from "../../domains/sensors/dps368";
import { SHT40_MASK } from "../../domains/sensors/sht40";
import { BS2_SENSOR_ID } from "../../domains/sensors/sensor-ids";
import { BS2_SIM_BOARD_PROFILE } from "../../device/board-profile";
import type { BitstreamTelemetrySensorCatalog, BitstreamTelemetrySensorCatalogEntry } from "../types";
import {
  BITSTREAM_TELEMETRY_PROVIDER_API_VERSION,
  BITSTREAM_TELEMETRY_PROVIDER_DEFAULT_WS_URL,
} from "../types";
import {
  BS2_PUBLISH_MODE_LABELS,
  FW_DELTA_MAX_X100,
  FW_SAMPLING_MAX_MS,
  FW_SAMPLING_MIN_MS,
  publishModeLabel,
} from "./firmware-limits";
import { buildSharedSensorConfigSchema } from "./shared-config-schema";
import { staleAfterMsFromSensorDefaults } from "./provider-stale-ms";

/** Bump when fields, masks, or config schema change (not every firmware tag). */
export const SENSOR_CATALOG_VERSION = "2026-06-10";

const SHARED_CONFIG = buildSharedSensorConfigSchema();

function cfgDefaults(sensorId: number): Record<string, boolean | number | string> {
  const row = BS2_SIM_BOARD_PROFILE.defaultSensorConfigs.find((c) => c.sensorId === sensorId);
  if (row == null) {
    throw new Error(`missing BS2_SIM_BOARD_PROFILE default for sensorId ${sensorId}`);
  }
  return {
    enabled: row.enabled,
    publishMode: publishModeLabel(row.publishMode),
    mask: row.mask,
    samplingIntervalMs: row.samplingIntervalMs,
    publishIntervalMs: row.publishIntervalMs,
    deltaX100: row.deltaX100,
    minPublishIntervalMs: row.minPublishIntervalMs,
  };
}

const BMI270_ENTRY: BitstreamTelemetrySensorCatalogEntry = {
  id: "bmi270",
  sensorId: BS2_SENSOR_ID.BMI270,
  label: "BMI270",
  fields: [
    { key: "accelX", label: "Acceleration X", unit: "m/s²", min: -20, max: 20, wireScale: 100 },
    { key: "accelY", label: "Acceleration Y", unit: "m/s²", min: -20, max: 20, wireScale: 100 },
    { key: "accelZ", label: "Acceleration Z", unit: "m/s²", min: -20, max: 20, wireScale: 100 },
    { key: "gyroX", label: "Gyro X", unit: "rad/s", min: -5, max: 5, wireScale: 100 },
    { key: "gyroY", label: "Gyro Y", unit: "rad/s", min: -5, max: 5, wireScale: 100 },
    { key: "gyroZ", label: "Gyro Z", unit: "rad/s", min: -5, max: 5, wireScale: 100 },
    { key: "temperatureC", label: "Temperature", unit: "°C", min: -40, max: 85, wireScale: 100 },
    {
      key: "headingRad",
      label: "Heading",
      unit: "rad",
      min: -3.15,
      max: 3.15,
      wireScale: 100,
      wireNote: "Fusion Euler; wire may use 0..2π, display as signed π.",
    },
    { key: "pitchRad", label: "Pitch", unit: "rad", min: -1.6, max: 1.6, wireScale: 100 },
    { key: "rollRad", label: "Roll", unit: "rad", min: -3.15, max: 3.15, wireScale: 100 },
    {
      key: "quatW",
      label: "Quaternion W",
      unit: "1",
      min: -1,
      max: 1,
      wireScale: 10000,
      wireNote: "Wire W is unsigned bucket: (qw×10000+10000).",
    },
    { key: "quatX", label: "Quaternion X", unit: "1", min: -1, max: 1, wireScale: 10000 },
    { key: "quatY", label: "Quaternion Y", unit: "1", min: -1, max: 1, wireScale: 10000 },
    { key: "quatZ", label: "Quaternion Z", unit: "1", min: -1, max: 1, wireScale: 10000 },
  ],
  maskChannels: [
    { bit: BMI270_MASK.ACC, key: "accelX", label: "Accel" },
    { bit: BMI270_MASK.GYR, key: "gyroX", label: "Gyro" },
    { bit: BMI270_MASK.TMP, key: "temperatureC", label: "Temp" },
    { bit: BMI270_MASK.EULER, key: "headingRad", label: "Euler" },
    { bit: BMI270_MASK.QUAT, key: "quatW", label: "Quaternion" },
  ],
  config: { ...SHARED_CONFIG },
  defaults: cfgDefaults(BS2_SENSOR_ID.BMI270),
  staleAfterMs: staleAfterMsFromSensorDefaults(cfgDefaults(BS2_SENSOR_ID.BMI270)),
  gaugeHints: {
    accel: { min: -2, max: 2, label: "Typical motion band (m/s²)" },
    gyro: { min: -1, max: 1, label: "Typical rotation band (rad/s)" },
  },
};

const BMM350_ENTRY: BitstreamTelemetrySensorCatalogEntry = {
  id: "bmm350",
  sensorId: BS2_SENSOR_ID.BMM350,
  label: "BMM350",
  fields: [
    { key: "magX", label: "Magnetic X", unit: "µT", min: -1000, max: 1000, wireScale: 100 },
    { key: "magY", label: "Magnetic Y", unit: "µT", min: -1000, max: 1000, wireScale: 100 },
    { key: "magZ", label: "Magnetic Z", unit: "µT", min: -1000, max: 1000, wireScale: 100 },
    { key: "temperatureC", label: "Temperature", unit: "°C", min: -40, max: 85, wireScale: 100 },
  ],
  maskChannels: [
    { bit: BMM350_MASK.MAG, key: "magX", label: "Magnetometer" },
    { bit: BMM350_MASK.TMP, key: "temperatureC", label: "Temp" },
  ],
  config: { ...SHARED_CONFIG },
  defaults: cfgDefaults(BS2_SENSOR_ID.BMM350),
  staleAfterMs: staleAfterMsFromSensorDefaults(cfgDefaults(BS2_SENSOR_ID.BMM350)),
  gaugeHints: {
    magAxis: { min: -100, max: 100, label: "Earth field band (µT)" },
    magMagnitude: { min: 0, max: 100, label: "Earth |B| band (µT)" },
  },
};

const SHT40_ENTRY: BitstreamTelemetrySensorCatalogEntry = {
  id: "sht40",
  sensorId: BS2_SENSOR_ID.SHT40,
  label: "SHT40",
  fields: [
    { key: "temperatureC", label: "Temperature", unit: "°C", min: -40, max: 125, wireScale: 100 },
    { key: "humidityPct", label: "Humidity", unit: "%RH", min: 0, max: 100, wireScale: 100 },
  ],
  maskChannels: [
    { bit: SHT40_MASK.TEMP, key: "temperatureC", label: "Temp" },
    { bit: SHT40_MASK.HUM, key: "humidityPct", label: "Humidity" },
  ],
  config: { ...SHARED_CONFIG },
  defaults: cfgDefaults(BS2_SENSOR_ID.SHT40),
  staleAfterMs: staleAfterMsFromSensorDefaults(cfgDefaults(BS2_SENSOR_ID.SHT40)),
};

const DPS368_ENTRY: BitstreamTelemetrySensorCatalogEntry = {
  id: "dps368",
  sensorId: BS2_SENSOR_ID.DPS368,
  label: "DPS368",
  fields: [
    {
      key: "pressureHpa",
      label: "Pressure",
      unit: "hPa",
      min: 300,
      max: 1200,
      wireScale: 10,
      wireNote: "Wire stores hPa×10 in int16.",
    },
    { key: "temperatureC", label: "Temperature", unit: "°C", min: -40, max: 85, wireScale: 100 },
  ],
  maskChannels: [
    { bit: DPS368_MASK.PRESS, key: "pressureHpa", label: "Pressure" },
    { bit: DPS368_MASK.TMP, key: "temperatureC", label: "Temp" },
  ],
  config: { ...SHARED_CONFIG },
  defaults: cfgDefaults(BS2_SENSOR_ID.DPS368),
  staleAfterMs: staleAfterMsFromSensorDefaults(cfgDefaults(BS2_SENSOR_ID.DPS368)),
  gaugeHints: {
    pressureSeaLevel: { min: 900, max: 1100, label: "Sea-level band (hPa)" },
    pressureFull: { min: 300, max: 1200, label: "Full sensor range (hPa)" },
  },
};

/** Canonical in-repo sensor catalog (source of truth). */
export const SENSOR_CATALOG_ENTRIES: readonly BitstreamTelemetrySensorCatalogEntry[] = [
  BMI270_ENTRY,
  BMM350_ENTRY,
  SHT40_ENTRY,
  DPS368_ENTRY,
] as const;

export function buildSensorCatalog(): BitstreamTelemetrySensorCatalog {
  return {
    catalogVersion: SENSOR_CATALOG_VERSION,
    providerApiVersion: BITSTREAM_TELEMETRY_PROVIDER_API_VERSION,
    providerWsUrl: BITSTREAM_TELEMETRY_PROVIDER_DEFAULT_WS_URL,
    sensors: SENSOR_CATALOG_ENTRIES.map((s) => structuredClone(s)),
    sharedConfigLimits: {
      samplingIntervalMs: { min: FW_SAMPLING_MIN_MS, max: FW_SAMPLING_MAX_MS },
      publishIntervalMs: { min: 0, max: FW_SAMPLING_MAX_MS },
      deltaX100: { min: 0, max: FW_DELTA_MAX_X100 },
      minPublishIntervalMs: { min: 0, max: FW_SAMPLING_MAX_MS },
      publishModes: [...BS2_PUBLISH_MODE_LABELS],
    },
  };
}

export function sensorCatalogEntryById(id: string): BitstreamTelemetrySensorCatalogEntry | null {
  return SENSOR_CATALOG_ENTRIES.find((s) => s.id === id) ?? null;
}

export function sensorCatalogEntryBySensorId(sensorId: number): BitstreamTelemetrySensorCatalogEntry | null {
  return SENSOR_CATALOG_ENTRIES.find((s) => s.sensorId === sensorId) ?? null;
}

export function buildStaleAfterMsBySensorId(): Map<string, number> {
  const map = new Map<string, number>();
  for (const entry of SENSOR_CATALOG_ENTRIES) {
    map.set(entry.id, entry.staleAfterMs);
  }
  return map;
}
