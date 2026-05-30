import assert from "node:assert/strict";
import test from "node:test";
import {
  hzSliderBoundsFromIntervalMsRange,
  hzSliderBoundsFromPresets,
  hzSliderStepFromPresets,
  hzValueFromIntervalMs,
  MIN_PUBLISH_HZ_PRESETS,
  SLOW_SENSOR_SAMPLING_HZ_PRESETS,
  snapHzToSliderStep,
} from "../../src/bitstream2/domains/config/sensor-rate-presets";

test("hz slider bounds — left low Hz, right high Hz", () => {
  const fusion = hzSliderBoundsFromIntervalMsRange(10, 200, false);
  assert.equal(fusion.minHz, 5);
  assert.equal(fusion.maxHz, 100);

  const sampling = hzSliderBoundsFromIntervalMsRange(10, 3000, false);
  assert.ok(sampling.minHz < 1);
  assert.equal(sampling.maxHz, 100);
});

test("hz value from interval ms", () => {
  assert.equal(hzValueFromIntervalMs(10), 100);
  assert.equal(hzValueFromIntervalMs(200), 5);
});

test("snap Hz to step 5", () => {
  assert.equal(snapHzToSliderStep(12, 5, 5, 100), 10);
  assert.equal(snapHzToSliderStep(98, 5, 5, 100), 100);
});

test("hz slider bounds from presets — min publish Off..20 Hz", () => {
  const bounds = hzSliderBoundsFromPresets(MIN_PUBLISH_HZ_PRESETS, true);
  assert.equal(bounds.minHz, 0);
  assert.equal(bounds.maxHz, 20);
});

test("hz slider bounds and step — DPS368/SHT40 slow sampling 0.33..20 Hz", () => {
  const bounds = hzSliderBoundsFromPresets(SLOW_SENSOR_SAMPLING_HZ_PRESETS, false);
  assert.equal(bounds.minHz, 0.33);
  assert.equal(bounds.maxHz, 20);
  assert.equal(hzSliderStepFromPresets(SLOW_SENSOR_SAMPLING_HZ_PRESETS), 0.01);
});
