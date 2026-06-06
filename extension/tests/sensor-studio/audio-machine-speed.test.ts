import assert from "node:assert/strict";
import test from "node:test";

import {
  clampMachineSpeed,
  resolveDroneDetuneHz,
  resolveDroneMotorHz,
  resolveEngineFireHz,
  resolveEngineRumbleHz,
  resolveIndustrialCycleHz,
  resolveMotorRippleHz,
  resolveMotorWhineHz,
} from "../../src/webview/sensor-studio/core/audio/audio-machine-speed";

test("clampMachineSpeed clamps to 0..1", () => {
  assert.equal(clampMachineSpeed(0.5), 0.5);
  assert.equal(clampMachineSpeed(2), 1);
  assert.equal(clampMachineSpeed(-1), 0);
  assert.equal(clampMachineSpeed("bad", 0.25), 0.25);
});

test("resolveMotorWhineHz maps speed across base and span", () => {
  assert.equal(
    resolveMotorWhineHz({ speed: 0, whineBaseHz: 100, whineSpanHz: 900 }),
    100,
  );
  assert.equal(
    resolveMotorWhineHz({ speed: 1, whineBaseHz: 100, whineSpanHz: 900 }),
    1000,
  );
});

test("resolveMotorRippleHz returns 0 when ripple disabled", () => {
  assert.equal(resolveMotorRippleHz(440, 0), 0);
});

test("resolveEngineRumbleHz and resolveEngineFireHz scale with speed", () => {
  assert.equal(
    resolveEngineRumbleHz({ speed: 0, rumbleBaseHz: 40, rumbleSpanHz: 80 }),
    40,
  );
  assert.equal(
    resolveEngineFireHz({ speed: 0, cylinders: 4 }),
    8,
  );
  assert.ok(
    resolveEngineFireHz({ speed: 1, cylinders: 6 }) >
      resolveEngineFireHz({ speed: 0, cylinders: 6 }),
  );
});

test("resolveDroneMotorHz and detune spread increase with speed and cents", () => {
  assert.equal(
    resolveDroneMotorHz({ speed: 0, motorBaseHz: 120, motorSpanHz: 500 }),
    120,
  );
  assert.ok(resolveDroneDetuneHz(400, 12) > resolveDroneDetuneHz(400, 0));
});

test("resolveIndustrialCycleHz maps speed across cycle range", () => {
  assert.equal(
    resolveIndustrialCycleHz({ speed: 0, cycleBaseHz: 1, cycleSpanHz: 8 }),
    1,
  );
  assert.equal(
    resolveIndustrialCycleHz({ speed: 1, cycleBaseHz: 1, cycleSpanHz: 8 }),
    9,
  );
});
