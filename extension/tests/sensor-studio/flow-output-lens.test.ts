import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyFlowOutputLensToGraph,
  collectFlowOutputUpstreamScope,
} from "../../src/webview/sensor-studio/core/flow/flow-output-lens";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

function studioNode(id: string, nodeId: string): FlowGraphNode {
  return {
    id,
    type: "studio",
    position: { x: 0, y: 0 },
    data: { label: id, category: "input", nodeId, defaultConfig: {} },
  } as FlowGraphNode;
}

test("collectFlowOutputUpstreamScope walks upstream from dashboard-output", () => {
  const nodes = [
    studioNode("sensor", "sensor-input"),
    studioNode("gauge", "dashboard-radial-gauge"),
    studioNode("out", "dashboard-output"),
  ];
  const edges = [
    { id: "e1", source: "sensor", target: "gauge" },
    { id: "e2", source: "gauge", target: "out" },
    { id: "e3", source: "scene", target: "out" },
  ];
  const scope = collectFlowOutputUpstreamScope(nodes, edges, "dashboard-output");
  assert.ok(scope != null);
  assert.equal(scope!.nodeIds.has("out"), true);
  assert.equal(scope!.nodeIds.has("gauge"), true);
  assert.equal(scope!.nodeIds.has("sensor"), true);
  assert.equal(scope!.nodeIds.has("scene"), false);
});

test("applyFlowOutputLensToGraph returns empty dashboard lens without dashboard-output", () => {
  const nodes = [
    studioNode("model", "model-select"),
    studioNode("out", "scene-output"),
  ];
  const edges = [{ id: "e1", source: "model", target: "out" }];
  const filtered = applyFlowOutputLensToGraph(nodes, edges, "dashboard");
  assert.equal(filtered.nodes.length, 0);
  assert.equal(filtered.edges.length, 0);
  assert.equal(filtered.scope, null);
});

test("applyFlowOutputLensToGraph filters stage lens", () => {
  const nodes = [
    studioNode("sensor", "sensor-input"),
    studioNode("spin", "part-spin"),
    studioNode("out", "scene-output"),
  ];
  const edges = [
    { id: "e1", source: "sensor", target: "spin" },
    { id: "e2", source: "spin", target: "out" },
  ];
  const filtered = applyFlowOutputLensToGraph(nodes, edges, "stage");
  assert.equal(filtered.nodes.length, 3);
  assert.equal(filtered.edges.length, 2);
});
