import assert from "node:assert/strict";
import test from "node:test";
import { bs2SampleToBitstreamSensorSampleV2 } from "../../src/webview/bitstream-app/bridge/bs2-sample-to-live-v2";
import { BS2_SENSOR_ID } from "../../src/bitstream2/domains/sensors/sensor-ids";
import { BMI270_MASK } from "../../src/bitstream2/domains/sensors/bmi270";

test("bs2SampleToBitstreamSensorSampleV2 maps BMI270 accel + temp (m/s²×100 pass-through)", () => {
  const sample = bs2SampleToBitstreamSensorSampleV2({
    sensorId: BS2_SENSOR_ID.BMI270,
    mask: BMI270_MASK.ACC | BMI270_MASK.TMP,
    counter: 7,
    tMs: 1000,
    values: [981, -120, 0, 2500],
    atMs: Date.now(),
  });
  assert.ok(sample);
  assert.equal(sample.sourceHint, "bmi270");
  assert.equal(sample.counter, 7);
  assert.equal(sample.deviceTMs, 1000);
  assert.equal(sample.temperatureCx100, 2500);
  assert.equal(sample.accelXMs2X100, 981);
  assert.equal(sample.accelYMs2X100, -120);
  assert.equal(sample.accelZMs2X100, 0);
});

test("bs2SampleToBitstreamSensorSampleV2 maps BMI270 gyro (rad/s×100 pass-through)", () => {
  const sample = bs2SampleToBitstreamSensorSampleV2({
    sensorId: BS2_SENSOR_ID.BMI270,
    mask: BMI270_MASK.GYR,
    counter: 1,
    tMs: 0,
    values: [150, -200, 300],
    atMs: Date.now(),
  });
  assert.ok(sample);
  assert.equal(sample.gyroXRadSX100, 150);
  assert.equal(sample.gyroYRadSX100, -200);
  assert.equal(sample.gyroZRadSX100, 300);
});

test("bs2SampleToBitstreamSensorSampleV2 maps BMM350 mag + temp", () => {
  const sample = bs2SampleToBitstreamSensorSampleV2({
    sensorId: BS2_SENSOR_ID.BMM350,
    mask: 0x03,
    counter: 3,
    tMs: 0,
    values: [2500, -1800, 4200, 2350],
    atMs: Date.now(),
  });
  assert.ok(sample);
  assert.equal(sample.sourceHint, "bmm350");
  assert.equal(sample.magneticXUtX100, 2500);
  assert.equal(sample.magneticYUtX100, -1800);
  assert.equal(sample.magneticZUtX100, 4200);
  assert.equal(sample.temperatureCx100, 2350);
});

test("bs2SampleToBitstreamSensorSampleV2 maps DPS368 pressure (hPa×10) + temp", () => {
  const sample = bs2SampleToBitstreamSensorSampleV2({
    sensorId: BS2_SENSOR_ID.DPS368,
    mask: 0x03,
    counter: 4,
    tMs: 0,
    values: [10130, 2400],
    atMs: Date.now(),
  });
  assert.ok(sample);
  assert.equal(sample.sourceHint, "dps368");
  assert.equal(sample.secondaryX100, 10130);
  assert.equal(sample.temperatureCx100, 2400);
});

test("bs2SampleToBitstreamSensorSampleV2 maps SHT40 temp + humidity", () => {
  const sample = bs2SampleToBitstreamSensorSampleV2({
    sensorId: BS2_SENSOR_ID.SHT40,
    mask: 0x03,
    counter: 2,
    tMs: 0,
    values: [2350, 5500],
    atMs: Date.now(),
  });
  assert.ok(sample);
  assert.equal(sample.sourceHint, "sht40");
  assert.equal(sample.deviceTMs, 0);
  assert.equal(sample.temperatureCx100, 2350);
  assert.equal(sample.secondaryX100, 5500);
});

test("bs2SampleToBitstreamSensorSampleV2 — BMI270 Euler is rad×100 on wire (not deg×100)", () => {
  const pitchRad = 1.57;
  const pitchWire = Math.round(pitchRad * 100);
  const sample = bs2SampleToBitstreamSensorSampleV2({
    sensorId: BS2_SENSOR_ID.BMI270,
    mask: BMI270_MASK.EULER,
    counter: 1,
    tMs: 0,
    values: [0, pitchWire, 0],
    atMs: Date.now(),
  });
  assert.ok(sample);
  assert.equal(sample.fusionPitchRadX100, pitchWire);
  assert.ok(sample.fusionPitchRadX100 != null && sample.fusionPitchRadX100 > 100);
});
