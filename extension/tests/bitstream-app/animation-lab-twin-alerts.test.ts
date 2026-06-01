import assert from "node:assert/strict";
import test from "node:test";
import { updateTwinMaintenanceAlerts } from "../../src/webview/bitstream-app/components/animation-lab/animation-lab-twin-alerts.js";
import type { AnimationLabTwinComponentLive } from "../../src/webview/bitstream-app/components/animation-lab/digital-twin.types.js";

function component(
  id: string,
  signals: AnimationLabTwinComponentLive["signals"],
): AnimationLabTwinComponentLive {
  return {
    id,
    label: id,
    health: "ok",
    signals,
  };
}

test("updateTwinMaintenanceAlerts raises and clears alerts", () => {
  const components = [
    component("motor-fl", [
      {
        key: "motor.fl.temp_c",
        label: "Temperature",
        unit: "°C",
        value: 55,
        health: "ok",
      },
    ]),
  ];

  const first = updateTwinMaintenanceAlerts({
    prevAlerts: [],
    prevHealth: new Map(),
    components,
    assetId: "tesa-drone",
    nowMs: 1000,
  });
  assert.equal(first.alerts.length, 0);

  const hot = updateTwinMaintenanceAlerts({
    prevAlerts: first.alerts,
    prevHealth: first.health,
    components: [
      component("motor-fl", [
        {
          key: "motor.fl.temp_c",
          label: "Temperature",
          unit: "°C",
          value: 82,
          health: "error",
        },
      ]),
    ],
    assetId: "tesa-drone",
    nowMs: 2000,
  });
  assert.equal(hot.alerts.length, 1);
  assert.equal(hot.alerts[0]?.clearedAtMs, undefined);
  assert.equal(hot.alerts[0]?.health, "error");

  const cleared = updateTwinMaintenanceAlerts({
    prevAlerts: hot.alerts,
    prevHealth: hot.health,
    components: [
      component("motor-fl", [
        {
          key: "motor.fl.temp_c",
          label: "Temperature",
          unit: "°C",
          value: 40,
          health: "ok",
        },
      ]),
    ],
    assetId: "tesa-drone",
    nowMs: 3000,
  });
  assert.equal(cleared.alerts.length, 1);
  assert.equal(cleared.alerts[0]?.clearedAtMs, 3000);
});
