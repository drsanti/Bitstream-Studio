import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveFallbackSingleModelSelectNodeId,
  resolveLinkedStudioModelDisplayLabel,
  resolveStudioModelScopeNodeId,
  resolveWiredStudioModelSelectNodeId,
} from "../../src/webview/sensor-studio/features/editor/model/model-generated-bindings";

test("resolveWiredStudioModelSelectNodeId follows model wire into model-viewer", () => {
  const nodes = [
    { id: "model-1", data: { nodeId: "model-select", defaultConfig: {} } },
    { id: "viewer-1", data: { nodeId: "model-viewer", defaultConfig: {} } },
  ];
  const edges = [{ source: "model-1", target: "viewer-1", targetHandle: "in", sourceHandle: "out" }];
  assert.equal(
    resolveWiredStudioModelSelectNodeId({ targetFlowNodeId: "viewer-1", edges, nodes }),
    "model-1",
  );
});

test("resolveStudioModelScopeNodeId prefers wired model over lone model fallback", () => {
  const nodes = [
    { id: "model-1", data: { nodeId: "model-select", defaultConfig: {} } },
    { id: "viewer-1", data: { nodeId: "model-viewer", defaultConfig: {} } },
  ];
  const edges = [{ source: "model-1", target: "viewer-1", targetHandle: "in", sourceHandle: "out" }];
  assert.equal(
    resolveStudioModelScopeNodeId({
      nodes,
      edges,
      defaultConfig: {},
      flowNodeId: "viewer-1",
      catalogNodeId: "model-viewer",
    }),
    "model-1",
  );
});

test("resolveFallbackSingleModelSelectNodeId returns id when exactly one model-select", () => {
  const nodes = [{ id: "only", data: { nodeId: "model-select", defaultConfig: {} } }];
  assert.equal(resolveFallbackSingleModelSelectNodeId(nodes), "only");
  assert.equal(resolveFallbackSingleModelSelectNodeId([]), undefined);
});

test("resolveStudioModelScopeNodeId follows model wire on event-trigger-glb-anim", () => {
  const nodes = [
    { id: "model-a", data: { nodeId: "model-select", defaultConfig: {} } },
    { id: "model-b", data: { nodeId: "model-select", defaultConfig: {} } },
    {
      id: "trigger-1",
      data: {
        nodeId: "event-trigger-glb-anim",
        defaultConfig: { sourceModelNodeId: "model-b" },
      },
    },
  ];
  const edges = [
    {
      source: "model-a",
      target: "trigger-1",
      targetHandle: "model",
      sourceHandle: "out",
    },
  ];
  assert.equal(
    resolveStudioModelScopeNodeId({
      nodes,
      edges,
      defaultConfig: nodes[2]!.data.defaultConfig,
      flowNodeId: "trigger-1",
      catalogNodeId: "event-trigger-glb-anim",
    }),
    "model-a",
  );
});

test("resolveLinkedStudioModelDisplayLabel uses parent label for wired model-viewer", () => {
  const nodes = [
    {
      id: "model-1",
      data: { nodeId: "model-select", label: "Cute Robot", defaultConfig: {} },
    },
    { id: "viewer-1", data: { nodeId: "model-viewer", defaultConfig: {} } },
  ];
  const edges = [{ source: "model-1", target: "viewer-1", targetHandle: "in", sourceHandle: "out" }];
  const link = resolveLinkedStudioModelDisplayLabel(nodes[1], nodes, edges);
  assert.deepEqual(link, { modelFlowId: "model-1", displayLabel: "Cute Robot" });
});
