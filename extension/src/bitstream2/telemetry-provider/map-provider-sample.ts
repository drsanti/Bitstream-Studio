import type { Bitstream2SensorSamplePayload } from "../bridge/protocol";
import { BMI270_MASK } from "../domains/sensors/bmi270";
import { BMM350_MASK } from "../domains/sensors/bmm350";
import { DPS368_MASK } from "../domains/sensors/dps368";
import { SHT40_MASK } from "../domains/sensors/sht40";
import { BS2_SENSOR_ID } from "../domains/sensors/sensor-ids";
import {
  sensorCatalogEntryBySensorId,
  type BitstreamTelemetrySensorCatalogEntry,
} from "./catalog/sensor-catalog-source";

export type BitstreamTelemetryProviderSamplePayload = {
  sensor: string;
  sensorId: number;
  counter: number;
  deviceMs: number;
  hostMs: number;
  origin?: "uart" | "sim";
  mask: number;
  fields: Record<string, number>;
  units: Record<string, string>;
};

function takeN(rest: number[], count: number): number[] | null {
  if (rest.length < count) {
    return null;
  }
  const slice = rest.splice(0, count);
  return slice;
}

function fieldDef(entry: BitstreamTelemetrySensorCatalogEntry, key: string) {
  return entry.fields.find((f) => f.key === key);
}

function wireToHuman(key: string, wire: number, wireScale: number): number {
  if (key === "quatW") {
    return (wire - 10000) / 10000;
  }
  return wire / wireScale;
}

function addField(
  entry: BitstreamTelemetrySensorCatalogEntry,
  fields: Record<string, number>,
  units: Record<string, string>,
  key: string,
  wire: number,
): void {
  const def = fieldDef(entry, key);
  if (def == null) {
    return;
  }
  fields[key] = wireToHuman(key, wire, def.wireScale);
  units[key] = def.unit;
}

function mapBmi270Fields(
  mask: number,
  values: number[],
  entry: BitstreamTelemetrySensorCatalogEntry,
): { fields: Record<string, number>; units: Record<string, string> } | null {
  const rest = [...values];
  const fields: Record<string, number> = {};
  const units: Record<string, string> = {};

  if ((mask & BMI270_MASK.ACC) !== 0) {
    const triple = takeN(rest, 3);
    if (triple == null) return null;
    addField(entry, fields, units, "accelX", triple[0]);
    addField(entry, fields, units, "accelY", triple[1]);
    addField(entry, fields, units, "accelZ", triple[2]);
  }
  if ((mask & BMI270_MASK.GYR) !== 0) {
    const triple = takeN(rest, 3);
    if (triple == null) return null;
    addField(entry, fields, units, "gyroX", triple[0]);
    addField(entry, fields, units, "gyroY", triple[1]);
    addField(entry, fields, units, "gyroZ", triple[2]);
  }
  if ((mask & BMI270_MASK.TMP) !== 0) {
    const t = takeN(rest, 1);
    if (t == null) return null;
    addField(entry, fields, units, "temperatureC", t[0]);
  }
  if ((mask & BMI270_MASK.EULER) !== 0) {
    const triple = takeN(rest, 3);
    if (triple == null) return null;
    addField(entry, fields, units, "headingRad", triple[0]);
    addField(entry, fields, units, "pitchRad", triple[1]);
    addField(entry, fields, units, "rollRad", triple[2]);
  }
  if ((mask & BMI270_MASK.QUAT) !== 0) {
    const quad = takeN(rest, 4);
    if (quad == null) return null;
    addField(entry, fields, units, "quatW", quad[0]);
    addField(entry, fields, units, "quatX", quad[1]);
    addField(entry, fields, units, "quatY", quad[2]);
    addField(entry, fields, units, "quatZ", quad[3]);
  }

  return { fields, units };
}

function mapBmm350Fields(
  mask: number,
  values: number[],
  entry: BitstreamTelemetrySensorCatalogEntry,
): { fields: Record<string, number>; units: Record<string, string> } | null {
  const rest = [...values];
  const fields: Record<string, number> = {};
  const units: Record<string, string> = {};

  if ((mask & BMM350_MASK.MAG) !== 0) {
    const triple = takeN(rest, 3);
    if (triple == null) return null;
    addField(entry, fields, units, "magX", triple[0]);
    addField(entry, fields, units, "magY", triple[1]);
    addField(entry, fields, units, "magZ", triple[2]);
  }
  if ((mask & BMM350_MASK.TMP) !== 0) {
    const t = takeN(rest, 1);
    if (t == null) return null;
    addField(entry, fields, units, "temperatureC", t[0]);
  }

  return { fields, units };
}

function mapSht40Fields(
  mask: number,
  values: number[],
  entry: BitstreamTelemetrySensorCatalogEntry,
): { fields: Record<string, number>; units: Record<string, string> } | null {
  const rest = [...values];
  const fields: Record<string, number> = {};
  const units: Record<string, string> = {};

  if ((mask & SHT40_MASK.TEMP) !== 0) {
    const t = takeN(rest, 1);
    if (t == null) return null;
    addField(entry, fields, units, "temperatureC", t[0]);
  }
  if ((mask & SHT40_MASK.HUM) !== 0) {
    const h = takeN(rest, 1);
    if (h == null) return null;
    addField(entry, fields, units, "humidityPct", h[0]);
  }

  return { fields, units };
}

function mapDps368Fields(
  mask: number,
  values: number[],
  entry: BitstreamTelemetrySensorCatalogEntry,
): { fields: Record<string, number>; units: Record<string, string> } | null {
  const rest = [...values];
  const fields: Record<string, number> = {};
  const units: Record<string, string> = {};

  if ((mask & DPS368_MASK.PRESS) !== 0) {
    const p = takeN(rest, 1);
    if (p == null) return null;
    addField(entry, fields, units, "pressureHpa", p[0]);
  }
  if ((mask & DPS368_MASK.TMP) !== 0) {
    const t = takeN(rest, 1);
    if (t == null) return null;
    addField(entry, fields, units, "temperatureC", t[0]);
  }

  return { fields, units };
}

/** Map decoded `bitstream2/evt/sensor` JSON into the public provider sample shape. */
export function mapBs2ToProviderSample(
  payload: Bitstream2SensorSamplePayload,
): BitstreamTelemetryProviderSamplePayload | null {
  const entry = sensorCatalogEntryBySensorId(payload.sensorId);
  if (entry == null) {
    return null;
  }

  const mask = payload.mask & 0xff;
  let mapped: { fields: Record<string, number>; units: Record<string, string> } | null = null;

  switch (payload.sensorId) {
    case BS2_SENSOR_ID.BMI270:
      mapped = mapBmi270Fields(mask, payload.values, entry);
      break;
    case BS2_SENSOR_ID.BMM350:
      mapped = mapBmm350Fields(mask, payload.values, entry);
      break;
    case BS2_SENSOR_ID.SHT40:
      mapped = mapSht40Fields(mask, payload.values, entry);
      break;
    case BS2_SENSOR_ID.DPS368:
      mapped = mapDps368Fields(mask, payload.values, entry);
      break;
    default:
      return null;
  }

  if (mapped == null || Object.keys(mapped.fields).length === 0) {
    return null;
  }

  return {
    sensor: entry.id,
    sensorId: payload.sensorId,
    counter: payload.counter,
    deviceMs: payload.tMs >>> 0,
    hostMs: payload.atMs,
    origin: payload.origin,
    mask,
    fields: mapped.fields,
    units: mapped.units,
  };
}
