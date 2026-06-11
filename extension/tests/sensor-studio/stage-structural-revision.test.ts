import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateStageSceneSnapshot } from "../../src/webview/sensor-studio/core/stage/evaluate-stage-scene-snapshot";
import {
  graphHasSceneOutputNode,
  readStageStructuralRevision,
} from "../../src/webview/sensor-studio/core/stage/stage-structural-revision";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-graph-types";

function studioNode(
  id: string,
  nodeId: string,
  defaultConfig: Record<string, unknown> = {},
): FlowGraphNode {
  return {
    id,
    type: "studio",
    position: { x: 0, y: 0 },
    data: { nodeId, label: nodeId, defaultConfig },
  } as FlowGraphNode;
}

test("graphHasSceneOutputNode detects scene-output", () => {
  assert.equal(graphHasSceneOutputNode([]), false);
  assert.equal(
    graphHasSceneOutputNode([studioNode("o1", "scene-output")]),
    true,
  );
});

test("readStageStructuralRevision bumps when model wire changes", () => {
  const model = studioNode("m1", "model-select", {
    selectedModelUrl: "robot.glb",
  });
  const output = studioNode("o1", "scene-output", { showGrid: true });
  const edges = [
    {
      id: "e1",
      source: "m1",
      target: "o1",
      sourceHandle: "out",
      targetHandle: "models",
    },
  ];
  const revA = readStageStructuralRevision([model, output], edges);
  const revB = readStageStructuralRevision(
    [
      studioNode("m1", "model-select", { selectedModelUrl: "other.glb" }),
      output,
    ],
    edges,
  );
  assert.notEqual(revA, revB);
});

test("evaluateStageSceneSnapshot commits model from structural graph", () => {
  const snapshot = evaluateStageSceneSnapshot({
    nodes: [
      studioNode("m1", "model-select", { selectedModelUrl: "pack/robot.glb" }),
      studioNode("o1", "scene-output"),
    ],
    edges: [
      {
        id: "e1",
        source: "m1",
        target: "o1",
        sourceHandle: "out",
        targetHandle: "models",
      },
    ],
  });
  assert.equal(snapshot.sceneOutputNodeId, "o1");
  assert.equal(snapshot.models.length, 1);
  assert.equal(snapshot.models[0]!.modelUrl, "pack/robot.glb");
});

test("evaluateStageSceneSnapshot resolves model URL from studio asset id catalog", () => {
  const snapshot = evaluateStageSceneSnapshot({
    nodes: [
      studioNode("m1", "model-select", {
        selectedStudioAssetId: "pack.model.tesa-drone",
      }),
      studioNode("o1", "scene-output"),
    ],
    edges: [
      {
        id: "e1",
        source: "m1",
        target: "o1",
        sourceHandle: "out",
        targetHandle: "models",
      },
    ],
    catalog: [
      {
        id: "pack.model.tesa-drone",
        category: "model",
        label: "TESA drone",
        relativePath: "models/tesa-drone.glb",
      },
    ],
  });
  assert.equal(snapshot.models.length, 1);
  assert.equal(snapshot.models[0]!.modelUrl, "models/tesa-drone.glb");
});
