import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { BMI270_MASK } from "../../src/bitstream2/domains/sensors/bmi270";
import { BMM350_MASK } from "../../src/bitstream2/domains/sensors/bmm350";
import { DPS368_MASK } from "../../src/bitstream2/domains/sensors/dps368";
import { SHT40_MASK } from "../../src/bitstream2/domains/sensors/sht40";
import { BS2_SENSOR_ID } from "../../src/bitstream2/domains/sensors/sensor-ids";
import {
  FW_DELTA_MAX_X100,
  FW_SAMPLING_MAX_MS,
  FW_SAMPLING_MIN_MS,
} from "../../src/bitstream2/telemetry-provider/catalog/firmware-limits";
import {
  buildSensorCatalog,
  SENSOR_CATALOG_ENTRIES,
  SENSOR_CATALOG_VERSION,
} from "../../src/bitstream2/telemetry-provider/catalog/sensor-catalog-source";
import type { BitstreamTelemetrySensorCatalog } from "../../src/bitstream2/telemetry-provider/types";

const GENERATED_JSON_SRC = resolve(
  __dirname,
  "../../src/bitstream2/telemetry-provider/sensor-catalog.v1.json",
);
const GENERATED_JSON_KIT = resolve(
  __dirname,
  "../../docs/bitstream-telemetry-provider/sensor-catalog.v1.json",
);

test("sensor catalog covers all BS2_SENSOR_ID values", () => {
  const ids = new Set(SENSOR_CATALOG_ENTRIES.map((s) => s.sensorId));
  for (const sensorId of Object.values(BS2_SENSOR_ID)) {
    assert.ok(ids.has(sensorId), `missing catalog entry for sensorId ${sensorId}`);
  }
  assert.equal(SENSOR_CATALOG_ENTRIES.length, Object.keys(BS2_SENSOR_ID).length);
});

test("sensor catalog mask bits align with domain constants", () => {
  const bmi = SENSOR_CATALOG_ENTRIES.find((s) => s.id === "bmi270");
  assert.ok(bmi);
  const bmiBits = new Set(bmi.maskChannels.map((c) => c.bit));
  assert.ok(bmiBits.has(BMI270_MASK.ACC));
  assert.ok(bmiBits.has(BMI270_MASK.GYR));
  assert.ok(bmiBits.has(BMI270_MASK.TMP));
  assert.ok(bmiBits.has(BMI270_MASK.EULER));
  assert.ok(bmiBits.has(BMI270_MASK.QUAT));

  const bmm = SENSOR_CATALOG_ENTRIES.find((s) => s.id === "bmm350");
  assert.ok(bmm);
  assert.deepEqual(
    bmm.maskChannels.map((c) => c.bit).sort((a, b) => a - b),
    [BMM350_MASK.MAG, BMM350_MASK.TMP].sort((a, b) => a - b),
  );

  const sht = SENSOR_CATALOG_ENTRIES.find((s) => s.id === "sht40");
  assert.ok(sht);
  assert.deepEqual(
    sht.maskChannels.map((c) => c.bit).sort((a, b) => a - b),
    [SHT40_MASK.TEMP, SHT40_MASK.HUM].sort((a, b) => a - b),
  );

  const dps = SENSOR_CATALOG_ENTRIES.find((s) => s.id === "dps368");
  assert.ok(dps);
  assert.deepEqual(
    dps.maskChannels.map((c) => c.bit).sort((a, b) => a - b),
    [DPS368_MASK.PRESS, DPS368_MASK.TMP].sort((a, b) => a - b),
  );
});

test("sensor catalog exposes per-sensor staleAfterMs from publish defaults", () => {
  const bmi = SENSOR_CATALOG_ENTRIES.find((s) => s.id === "bmi270");
  const sht = SENSOR_CATALOG_ENTRIES.find((s) => s.id === "sht40");
  assert.ok(bmi && sht);
  assert.equal(bmi.staleAfterMs, 500);
  assert.equal(sht.staleAfterMs, 600);
});

test("shared config limits match firmware clamp constants", () => {
  const catalog = buildSensorCatalog();
  assert.equal(catalog.sharedConfigLimits.samplingIntervalMs.min, FW_SAMPLING_MIN_MS);
  assert.equal(catalog.sharedConfigLimits.samplingIntervalMs.max, FW_SAMPLING_MAX_MS);
  assert.equal(catalog.sharedConfigLimits.deltaX100.max, FW_DELTA_MAX_X100);
});

test("generated sensor-catalog.v1.json matches buildSensorCatalog()", () => {
  const built = buildSensorCatalog();
  for (const path of [GENERATED_JSON_SRC, GENERATED_JSON_KIT]) {
    const onDisk = JSON.parse(readFileSync(path, "utf8")) as BitstreamTelemetrySensorCatalog;
    assert.equal(onDisk.catalogVersion, SENSOR_CATALOG_VERSION);
    assert.deepEqual(onDisk, built, `catalog mismatch: ${path}`);
  }
});
