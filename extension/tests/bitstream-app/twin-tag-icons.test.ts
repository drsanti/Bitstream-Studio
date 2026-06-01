import assert from "node:assert/strict";
import test from "node:test";
import {
  readMotorLoadPctFromPrimarySignal,
  resolveTwinTagIconAnimation,
  resolveTwinTagIconId,
  twinTagIconSpinDurationS,
} from "../../src/webview/bitstream-app/components/animation-lab/animation-lab-twin-tag-icons.js";

test("resolveTwinTagIconId prefers metadata cardIcon", () => {
  assert.equal(
    resolveTwinTagIconId({
      componentId: "misc",
      group: "Sensors",
      cardIcon: "camera",
    }),
    "camera",
  );
});

test("resolveTwinTagIconId maps propulsion group to motor", () => {
  assert.equal(
    resolveTwinTagIconId({ componentId: "motor-fl", group: "Propulsion" }),
    "motor",
  );
});

test("resolveTwinTagIconAnimation uses fault blink on error", () => {
  assert.equal(
    resolveTwinTagIconAnimation({
      health: "error",
      iconId: "gimbal",
      dataSource: "simulated",
      active: true,
    }),
    "fault-blink",
  );
});

test("resolveTwinTagIconAnimation spins motors when ok", () => {
  assert.equal(
    resolveTwinTagIconAnimation({
      health: "ok",
      iconId: "motor",
      dataSource: "simulated",
      active: true,
    }),
    "spin",
  );
});

test("resolveTwinTagIconAnimation sweeps gimbals when ok", () => {
  assert.equal(
    resolveTwinTagIconAnimation({
      health: "ok",
      iconId: "gimbal",
      dataSource: "live",
      active: true,
    }),
    "sweep",
  );
});

test("readMotorLoadPctFromPrimarySignal reads percent load", () => {
  assert.equal(
    readMotorLoadPctFromPrimarySignal({
      key: "gimbal1.load_pct",
      value: 42.5,
      unit: "%",
    }),
    42.5,
  );
});

test("twinTagIconSpinDurationS speeds up with higher load", () => {
  const slow = twinTagIconSpinDurationS(10);
  const fast = twinTagIconSpinDurationS(90);
  assert.ok(fast < slow);
});

test("resolveTwinTagIconAnimation health level skips spin", () => {
  assert.equal(
    resolveTwinTagIconAnimation({
      health: "ok",
      iconId: "motor",
      dataSource: "simulated",
      active: true,
      animationLevel: "health",
    }),
    "none",
  );
});

test("resolveTwinTagIconAnimation off level is always none", () => {
  assert.equal(
    resolveTwinTagIconAnimation({
      health: "error",
      iconId: "motor",
      dataSource: "live",
      active: true,
      animationLevel: "off",
    }),
    "none",
  );
});
