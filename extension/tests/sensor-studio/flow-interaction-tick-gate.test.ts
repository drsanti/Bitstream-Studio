import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveFlowInteractionTickGate,
  resolveInteractionThrottleTickMaxFps,
} from "../../src/webview/sensor-studio/core/runtime/flow-interaction-tick-gate";

const defaults = {
  policy: "pause" as const,
  throttleFps: 10 as const,
  triggers: { nodeDrag: true, canvasPan: true },
  normalMaxFps: 60 as const,
};

test("resolveFlowInteractionTickGate pauses on node drag by default", () => {
  const gate = resolveFlowInteractionTickGate({
    ...defaults,
    nodeDragActive: true,
    canvasPanActive: false,
  });
  assert.equal(gate.blocked, true);
  assert.equal(gate.editingActive, true);
  assert.equal(gate.activeKind, "nodeDrag");
});

test("resolveFlowInteractionTickGate inherit keeps ticks running", () => {
  const gate = resolveFlowInteractionTickGate({
    ...defaults,
    policy: "inherit",
    nodeDragActive: false,
    canvasPanActive: true,
  });
  assert.equal(gate.blocked, false);
  assert.equal(gate.editingActive, true);
  assert.equal(gate.activeKind, "canvasPan");
  assert.equal(gate.tickMaxFps, 60);
});

test("resolveFlowInteractionTickGate throttle uses min of normal and throttle caps", () => {
  const gate = resolveFlowInteractionTickGate({
    ...defaults,
    policy: "throttle",
    throttleFps: 10,
    normalMaxFps: 15,
    nodeDragActive: true,
    canvasPanActive: false,
  });
  assert.equal(gate.blocked, false);
  assert.equal(gate.tickMaxFps, 10);
});

test("resolveFlowInteractionTickGate ignores disabled triggers", () => {
  const gate = resolveFlowInteractionTickGate({
    ...defaults,
    triggers: { nodeDrag: false, canvasPan: true },
    nodeDragActive: true,
    canvasPanActive: false,
  });
  assert.equal(gate.editingActive, false);
  assert.equal(gate.blocked, false);
  assert.equal(gate.activeKind, null);
});

test("resolveInteractionThrottleTickMaxFps honors unlimited normal cap", () => {
  assert.equal(resolveInteractionThrottleTickMaxFps(0, 5), 5);
  assert.equal(resolveInteractionThrottleTickMaxFps(15, 10), 10);
  assert.equal(resolveInteractionThrottleTickMaxFps(10, 15), 10);
});
