import assert from "node:assert/strict";
import test from "node:test";
import { BMI270_MASK } from "../../src/bitstream2/domains/sensors/bmi270";
import { SHT40_MASK } from "../../src/bitstream2/domains/sensors/sht40";
import { BS2_SENSOR_ID } from "../../src/bitstream2/domains/sensors/sensor-ids";
import type { Bitstream2SensorSamplePayload } from "../../src/bitstream2/bridge/protocol";
import { mapBs2ToProviderSample } from "../../src/bitstream2/telemetry-provider/map-provider-sample";

function basePayload(
  partial: Partial<Bitstream2SensorSamplePayload> & Pick<Bitstream2SensorSamplePayload, "sensorId" | "mask" | "values">,
): Bitstream2SensorSamplePayload {
  return {
    counter: 1,
    tMs: 120_000,
    atMs: 1_700_000_000_000,
    origin: "sim",
    ...partial,
  };
}

test("mapBs2ToProviderSample maps BMI270 gyro wire values to rad/s fields", () => {
  const mapped = mapBs2ToProviderSample(
    basePayload({
      sensorId: BS2_SENSOR_ID.BMI270,
      mask: BMI270_MASK.GYR,
      values: [150, -200, 50],
    }),
  );

  assert.ok(mapped);
  assert.equal(mapped.sensor, "bmi270");
  assert.equal(mapped.fields.gyroX, 1.5);
  assert.equal(mapped.fields.gyroY, -2);
  assert.equal(mapped.fields.gyroZ, 0.5);
  assert.equal(mapped.units.gyroX, "rad/s");
});

test("mapBs2ToProviderSample decodes quaternion W bucket", () => {
  const mapped = mapBs2ToProviderSample(
    basePayload({
      sensorId: BS2_SENSOR_ID.BMI270,
      mask: BMI270_MASK.QUAT,
      values: [10000, 5000, -3000, 0],
    }),
  );

  assert.ok(mapped);
  assert.equal(mapped.fields.quatW, 0);
  assert.equal(mapped.fields.quatX, 0.5);
  assert.equal(mapped.fields.quatY, -0.3);
  assert.equal(mapped.fields.quatZ, 0);
});

test("mapBs2ToProviderSample maps SHT40 temperature and humidity", () => {
  const mapped = mapBs2ToProviderSample(
    basePayload({
      sensorId: BS2_SENSOR_ID.SHT40,
      mask: SHT40_MASK.TEMP | SHT40_MASK.HUM,
      values: [2456, 4820],
    }),
  );

  assert.ok(mapped);
  assert.equal(mapped.sensor, "sht40");
  assert.equal(mapped.fields.temperatureC, 24.56);
  assert.equal(mapped.fields.humidityPct, 48.2);
  assert.equal(mapped.units.humidityPct, "%RH");
});
