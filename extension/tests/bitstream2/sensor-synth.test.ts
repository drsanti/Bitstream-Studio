import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSyntheticSensorValues,
  simPhaseFromTimeMs,
  simSineI16,
} from "../../src/bitstream2/device/sensor-synth";
import { BS2_SENSOR_ID } from "../../src/bitstream2/domains/sensors/sensor-ids";
import { BMI270_MASK } from "../../src/bitstream2/domains/sensors/bmi270";
import { scalarsFromValuesBytes } from "../../src/bitstream2/device/publish-gate";

test("sensor synth: BMI270 full mask uses sine-only varying scalars", () => {
  const mask =
    BMI270_MASK.ACC |
    BMI270_MASK.GYR |
    BMI270_MASK.TMP |
    BMI270_MASK.EULER |
    BMI270_MASK.QUAT;
  const t0 = 0;
  const tQuarter = 1250;
  const a = scalarsFromValuesBytes(buildSyntheticSensorValues(BS2_SENSOR_ID.BMI270, mask, t0));
  const b = scalarsFromValuesBytes(
    buildSyntheticSensorValues(BS2_SENSOR_ID.BMI270, mask, tQuarter),
  );
  assert.equal(a.length, b.length);
  assert.ok(a.length > 0);
  assert.notDeepEqual(a, b, "values should change over a quarter cycle");
  /* Euler channels (indices 7–9): rad×100, magnitude ≤ ~π×100. */
  for (const idx of [7, 8, 9]) {
    assert.ok(Math.abs(a[idx]!) <= 314, `euler wire[${idx}] should be rad×100 within ±π`);
  }
});

test("sensor synth: all four sensors emit non-empty sine payloads", () => {
  const sensors: Array<{ id: number; mask: number }> = [
    { id: BS2_SENSOR_ID.BMI270, mask: 0x1f },
    { id: BS2_SENSOR_ID.BMM350, mask: 0x03 },
    { id: BS2_SENSOR_ID.SHT40, mask: 0x03 },
    { id: BS2_SENSOR_ID.DPS368, mask: 0x03 },
  ];
  for (const { id, mask } of sensors) {
    const bytes = buildSyntheticSensorValues(id, mask, 5000);
    assert.ok(bytes.byteLength > 0, `sensor ${id} should produce values`);
    const early = scalarsFromValuesBytes(buildSyntheticSensorValues(id, mask, 0));
    const late = scalarsFromValuesBytes(buildSyntheticSensorValues(id, mask, 1250));
    assert.notDeepEqual(early, late, `sensor ${id} scalars should vary in time`);
  }
});
