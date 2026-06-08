import assert from "node:assert/strict";
import { test } from "node:test";
import type { Edge } from "@xyflow/react";
import { createStudioNodeGroupFromSelection } from "../../src/webview/sensor-studio/features/editor/subgraphs/create-studio-node-group";
import {
  resolveRootCanvasViewOnHydrate,
  resolveSubgraphCanvasViewOnRestore,
} from "../../src/webview/sensor-studio/features/editor/subgraphs/resolve-subgraph-canvas-view";
import { STUDIO_ROOT_GRAPH_ID } from "../../src/webview/sensor-studio/features/editor/subgraphs/studio-subgraph.types";
import type { StudioNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

function makeNumberNode(id: string, x: number): StudioNode {
  return {
    id,
    type: "studio",
    position: { x, y: 80 },
    data: {
      nodeId: "number-constant",
      label: "Number",
      category: "constants",
      defaultConfig: { value: 1 },
      outputType: "number",
    },
    selected: true,
  };
}

test("resolveRootCanvasViewOnHydrate falls back to canonical edges when root buffer is empty", () => {
  const a = makeNumberNode("demo-a", 40);
  const b = makeNumberNode("demo-b", 240);
  a.selected = false;
  b.selected = false;
  const canonicalEdges: Edge[] = [
    {
      id: "e1",
      source: "demo-a",
      target: "demo-b",
      sourceHandle: "out",
      targetHandle: "in",
    },
  ];
  const view = resolveRootCanvasViewOnHydrate({
    rootNodes: [a, b],
    rootEdges: [],
    canonicalNodes: [a, b],
    canonicalEdges,
  });
  assert.equal(view.edges.length, 1);
  assert.equal(view.edges[0]?.id, "e1");
});

test("resolveRootCanvasViewOnHydrate always opens root graph", () => {
  const inner = makeNumberNode("inner", 120);
  inner.selected = false;
  const groupId = "group_hydrate";
  const { groupNode, subgraph } = createStudioNodeGroupFromSelection(
    groupId,
    [inner],
    [],
    [inner],
  );
  const view = resolveRootCanvasViewOnHydrate({
    rootNodes: [groupNode],
    rootEdges: [],
  });
  assert.equal(view.activeGraphId, STUDIO_ROOT_GRAPH_ID);
  assert.deepEqual(view.graphStack, []);
  assert.equal(view.nodes.length, 1);
  assert.equal(view.nodes[0]?.type, "studio-node-group");
  assert.ok(subgraph.nodes.length > 0);
});

test("resolveSubgraphCanvasViewOnRestore loads subgraph when navigation is valid", () => {
  const inner = makeNumberNode("inner_restore", 120);
  inner.selected = false;
  const groupId = "group_restore";
  const { groupNode, subgraph } = createStudioNodeGroupFromSelection(
    groupId,
    [inner],
    [],
    [inner],
  );
  const view = resolveSubgraphCanvasViewOnRestore({
    rootNodes: [groupNode],
    rootEdges: [],
    subgraphs: { [groupId]: subgraph },
    activeGraphId: groupId,
    graphStack: [STUDIO_ROOT_GRAPH_ID, groupId],
  });
  assert.equal(view.activeGraphId, groupId);
  assert.deepEqual(view.graphStack, [STUDIO_ROOT_GRAPH_ID, groupId]);
  assert.ok(view.nodes.some((n) => n.type === "studio-group-input"));
  assert.ok(view.nodes.some((n) => n.type === "studio"));
});

test("resolveSubgraphCanvasViewOnRestore falls back to root for stale graph id", () => {
  const view = resolveSubgraphCanvasViewOnRestore({
    rootNodes: [],
    rootEdges: [],
    subgraphs: {},
    activeGraphId: "missing_group",
    graphStack: [STUDIO_ROOT_GRAPH_ID, "missing_group"],
  });
  assert.equal(view.activeGraphId, STUDIO_ROOT_GRAPH_ID);
  assert.deepEqual(view.graphStack, []);
});
