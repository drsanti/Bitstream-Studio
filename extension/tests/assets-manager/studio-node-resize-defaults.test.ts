import assert from "node:assert/strict";
import test from "node:test";
import { studioNodeDefaultResizable } from "../../src/webview/sensor-studio/features/editor/nodes/flow-node/studio-node-resize-defaults";

test("studioNodeDefaultResizable enables viewport and output nodes", () => {
  assert.equal(studioNodeDefaultResizable("model-viewer"), true);
  assert.equal(studioNodeDefaultResizable("plotter"), true);
  assert.equal(studioNodeDefaultResizable("radial-gauge"), true);
  assert.equal(studioNodeDefaultResizable("rotation-3d-euler"), true);
});

test("studioNodeDefaultResizable disables compact utility nodes", () => {
  assert.equal(studioNodeDefaultResizable("model-select"), false);
  assert.equal(studioNodeDefaultResizable("number-constant"), false);
  assert.equal(studioNodeDefaultResizable("math"), false);
  assert.equal(studioNodeDefaultResizable("bmi270-input"), false);
});
