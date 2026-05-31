import assert from "node:assert/strict";
import test from "node:test";

import {
  graphNeedsSceneFrameTick,
  nodeIdNeedsSceneFrameTick,
} from "../../src/webview/sensor-studio/core/flow/scene-flow-frame-subscribers";
import type { StudioNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

function canvasNode(nodeId: string): StudioNode {
  return {
    id: `n-${nodeId}`,
    type: "studio",
    position: { x: 0, y: 0 },
    data: {
      nodeId,
      label: nodeId,
      category: "utility",
      defaultConfig: {},
      inputHandles: [],
      outputHandles: [],
    },
  };
}

test("nodeIdNeedsSceneFrameTick flags 3D preview and scene wire nodes", () => {
  assert.equal(nodeIdNeedsSceneFrameTick("model-viewer"), true);
  assert.equal(nodeIdNeedsSceneFrameTick("rotation-3d-euler"), true);
  assert.equal(nodeIdNeedsSceneFrameTick("environment"), true);
  assert.equal(nodeIdNeedsSceneFrameTick("object-transform"), true);
  assert.equal(nodeIdNeedsSceneFrameTick("transform-from-euler"), true);
  assert.equal(nodeIdNeedsSceneFrameTick("sine-wave"), true);
});

test("nodeIdNeedsSceneFrameTick ignores pure telemetry output nodes", () => {
  assert.equal(nodeIdNeedsSceneFrameTick("plotter"), false);
  assert.equal(nodeIdNeedsSceneFrameTick("radial-gauge"), false);
  assert.equal(nodeIdNeedsSceneFrameTick("sensor-input"), false);
});

test("graphNeedsSceneFrameTick is true when any subscriber is present", () => {
  assert.equal(graphNeedsSceneFrameTick([canvasNode("plotter"), canvasNode("sensor-input")]), false);
  assert.equal(graphNeedsSceneFrameTick([canvasNode("plotter"), canvasNode("model-viewer")]), true);
  assert.equal(graphNeedsSceneFrameTick([canvasNode("sine-wave")]), true);
});
