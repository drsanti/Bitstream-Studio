import assert from "node:assert/strict";
import test from "node:test";

import { collectFlowMeshEntries } from "../../src/webview/sensor-studio/core/stage/collect-flow-mesh-entries";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-graph-types";

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

test("collectFlowMeshEntries reads model-viewer meshes input", () => {
  const viewer = studioNode("viewer-1", "model-viewer");
  const box = studioNode("box-1", "mesh-box", {
    version: 1,
    kind: "box",
    box: { width: 1, height: 2, depth: 3 },
  });

  const entries = collectFlowMeshEntries({
    nodes: [viewer, box],
    edges: [
      {
        id: "e1",
        source: "box-1",
        target: "viewer-1",
        sourceHandle: "out",
        targetHandle: "meshes",
      },
    ],
    targetNodeId: "viewer-1",
    targetHandle: "meshes",
  });

  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.sourceNodeId, "box-1");
  assert.equal(entries[0]?.wire.kind, "box");
  assert.equal(entries[0]?.wire.box?.height, 2);
});
