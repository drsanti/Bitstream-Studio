import assert from "node:assert/strict";
import test from "node:test";

import {
  graphNeedsAudioFrameTick,
  graphNeedsCameraFrameTick,
  graphNeedsSceneFrameTick,
  graphNeedsSceneFrameTickInDocument,
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

test("graphNeedsSceneFrameTickInDocument finds Scene Output on root while editing subgraph", () => {
  assert.equal(
    graphNeedsSceneFrameTickInDocument({
      nodes: [canvasNode("plotter")],
      rootNodes: [canvasNode("scene-output")],
      subgraphs: { "group-1": { nodes: [canvasNode("sine-wave")] } },
    }),
    true,
  );
  assert.equal(
    graphNeedsSceneFrameTickInDocument({
      nodes: [canvasNode("plotter")],
      rootNodes: [],
      subgraphs: { "group-1": { nodes: [canvasNode("sine-wave")] } },
    }),
    true,
  );
});

test("graphNeedsAudioFrameTick is true when audio nodes are on the canvas", () => {
  assert.equal(graphNeedsAudioFrameTick([canvasNode("plotter")]), false);
  assert.equal(graphNeedsAudioFrameTick([canvasNode("audio-oscillator")]), true);
});

test("graphNeedsCameraFrameTick is true when camera nodes are on the canvas", () => {
  assert.equal(graphNeedsCameraFrameTick([canvasNode("plotter")]), false);
  assert.equal(graphNeedsCameraFrameTick([canvasNode("camera-input")]), true);
  assert.equal(graphNeedsCameraFrameTick([canvasNode("video-texture")]), true);
  assert.equal(graphNeedsCameraFrameTick([canvasNode("material-video")]), true);
  assert.equal(graphNeedsCameraFrameTick([canvasNode("css3d-camera-feed")]), true);
  assert.equal(graphNeedsCameraFrameTick([canvasNode("vision-pose")]), true);
  assert.equal(graphNeedsCameraFrameTick([canvasNode("vision-hands")]), true);
});
