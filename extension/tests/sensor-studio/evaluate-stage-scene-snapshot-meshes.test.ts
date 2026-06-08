import assert from "node:assert/strict";
import test from "node:test";

import { stageSceneOutputDefaultScene3d } from "../../src/webview/sensor-studio/core/stage/stage-scene-defaults";
import { evaluateStageSceneSnapshot } from "../../src/webview/sensor-studio/core/stage/evaluate-stage-scene-snapshot";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-graph-types";
import { STUDIO_HANDLE_MESHES, STUDIO_HANDLE_OUT } from "../../src/webview/sensor-studio/features/editor/studio-handle-ids";

function studioNode(
  flowId: string,
  nodeId: string,
  liveMeshWire?: unknown,
): FlowGraphNode {
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

test("evaluateStageSceneSnapshot collects wired procedural meshes", () => {
  const output = studioNode("out-1", "scene-output");
  const plane = studioNode("plane-1", "mesh-plane", {
    version: 1,
    kind: "plane",
    plane: { width: 2, height: 2 },
    material: {
      version: 1,
      kind: "standard",
      colorHex: "#ffffff",
      opacity: 1,
      roughness: 0.5,
      metalness: 0,
    },
  });

  const snapshot = evaluateStageSceneSnapshot({
    nodes: [output, plane],
    edges: [
      {
        id: "e1",
        source: "plane-1",
        target: "out-1",
        sourceHandle: STUDIO_HANDLE_OUT,
        targetHandle: STUDIO_HANDLE_MESHES,
      },
    ],
  });

  assert.equal(snapshot.meshes.length, 1);
  assert.equal(snapshot.meshes[0]?.sourceNodeId, "plane-1");
  assert.equal(snapshot.meshes[0]?.wire.kind, "plane");
  assert.equal(snapshot.meshes[0]?.wire.plane?.width, 2);
});

test("evaluateStageSceneSnapshot returns empty meshes without scene output", () => {
  const snapshot = evaluateStageSceneSnapshot({
    nodes: [studioNode("plane-1", "mesh-plane")],
    edges: [],
  });
  assert.equal(snapshot.meshes.length, 0);
});

test("evaluateStageSceneSnapshot flattens mesh group into leaf entries", () => {
  const output = studioNode("out-1", "scene-output");
  const group = studioNode("group-1", "mesh-group", {
    version: 1,
    kind: "group",
    children: [
      {
        version: 1,
        kind: "box",
        box: { width: 1, height: 1, depth: 1 },
      },
      {
        version: 1,
        kind: "sphere",
        sphere: { radius: 0.5, widthSegments: 32, heightSegments: 16 },
      },
    ],
  });

  const snapshot = evaluateStageSceneSnapshot({
    nodes: [output, group],
    edges: [
      {
        id: "e1",
        source: "group-1",
        target: "out-1",
        sourceHandle: STUDIO_HANDLE_OUT,
        targetHandle: STUDIO_HANDLE_MESHES,
      },
    ],
  });

  assert.equal(snapshot.meshes.length, 2);
  assert.equal(snapshot.meshes[0]?.wire.kind, "box");
  assert.equal(snapshot.meshes[1]?.wire.kind, "sphere");
  assert.equal(snapshot.meshes[0]?.meshLeafIndex, 0);
  assert.equal(snapshot.meshes[1]?.meshLeafIndex, 1);
});

test("evaluateStageSceneSnapshot clears baked model url when meshes-only", () => {
  const baked = stageSceneOutputDefaultScene3d();
  assert.ok(baked.model.url.length > 0);
  const output = studioNode("out-1", "scene-output");
  output.data.defaultConfig = { scene3d: baked };
  const plane = studioNode("plane-1", "mesh-plane", {
    version: 1,
    kind: "plane",
    plane: { width: 2, height: 2 },
    material: {
      version: 1,
      kind: "standard",
      colorHex: "#ffffff",
      opacity: 1,
      roughness: 0.5,
      metalness: 0,
    },
  });

  const snapshot = evaluateStageSceneSnapshot({
    nodes: [output, plane],
    edges: [
      {
        id: "e1",
        source: "plane-1",
        target: "out-1",
        sourceHandle: STUDIO_HANDLE_OUT,
        targetHandle: STUDIO_HANDLE_MESHES,
      },
    ],
  });

  assert.equal(snapshot.models.length, 0);
  assert.equal(snapshot.meshes.length, 1);
  assert.equal(snapshot.scene3d.model.url, "");
  assert.equal(snapshot.scene3d.model.studioAssetId, undefined);
});
