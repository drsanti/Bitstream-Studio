import assert from "node:assert/strict";
import test from "node:test";

import {
  clampMachineSpeed,
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
