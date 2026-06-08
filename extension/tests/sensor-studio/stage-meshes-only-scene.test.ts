import assert from "node:assert/strict";
import test from "node:test";

import {
  orphanSceneOutputModelEdgeIds,
  sceneOutputModelWireEdgeIds,
} from "../../src/webview/sensor-studio/core/stage/stage-meshes-only-scene";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-graph-types";
import {
  STUDIO_HANDLE_MESHES,
  STUDIO_HANDLE_MODELS,
  STUDIO_HANDLE_OUT,
} from "../../src/webview/sensor-studio/features/editor/studio-handle-ids";

function studioNode(flowId: string, nodeId: string, liveMeshWire?: unknown): FlowGraphNode {
  return {
    id: flowId,
    type: "studio",
    position: { x: 0, y: 0 },
    data: {
      nodeId,
      label: nodeId,
      defaultConfig: {},
      liveMeshWire,
    },
  } as FlowGraphNode;
}

test("orphanSceneOutputModelEdgeIds returns Models wires only when meshes-only", () => {
  const output = studioNode("out-1", "scene-output");
  const model = studioNode("model-1", "model-select");
  const plane = studioNode("plane-1", "mesh-plane", {
    version: 1,
    kind: "box",
    box: { width: 1, height: 1, depth: 1 },
    material: {
      version: 1,
      kind: "standard",
      colorHex: "#ffffff",
      opacity: 1,
      roughness: 0.5,
      metalness: 0,
    },
  });
  const edges = [
    {
      id: "model-edge",
      source: "model-1",
      target: "out-1",
      sourceHandle: STUDIO_HANDLE_OUT,
      targetHandle: STUDIO_HANDLE_MODELS,
    },
    {
      id: "mesh-edge",
      source: "plane-1",
      target: "out-1",
      sourceHandle: STUDIO_HANDLE_OUT,
      targetHandle: STUDIO_HANDLE_MESHES,
    },
  ];

  assert.deepEqual(
    orphanSceneOutputModelEdgeIds({ nodes: [output, model, plane], edges }),
    ["model-edge"],
  );
  assert.deepEqual(
    orphanSceneOutputModelEdgeIds({ nodes: [output, model], edges: [edges[0]!] }),
    [],
  );
});

test("sceneOutputModelWireEdgeIds lists Scene Output Models handle edges", () => {
  const edges = [
    {
      id: "a",
      source: "m1",
      target: "out-1",
      sourceHandle: STUDIO_HANDLE_OUT,
      targetHandle: STUDIO_HANDLE_MODELS,
    },
    {
      id: "b",
      source: "p1",
      target: "out-1",
      sourceHandle: STUDIO_HANDLE_OUT,
      targetHandle: STUDIO_HANDLE_MESHES,
    },
  ];
  assert.deepEqual(sceneOutputModelWireEdgeIds(edges, "out-1"), ["a"]);
});
