import assert from "node:assert/strict";
import { test } from "node:test";
import type { Edge } from "@xyflow/react";
import { createStudioNodeGroupFromSelection } from "../../src/webview/sensor-studio/features/editor/subgraphs/create-studio-node-group";
import { flattenFlowGraphForEvaluation } from "../../src/webview/sensor-studio/features/editor/subgraphs/flatten-flow-graph-for-evaluation";
import { buildStudioNodeGroupHostLiveFields } from "../../src/webview/sensor-studio/features/editor/subgraphs/studio-group-boundary-live";
import { rewireParentGraphForStudioGroup } from "../../src/webview/sensor-studio/features/editor/subgraphs/rewire-parent-graph-for-group";
import { studioFlowPinKey } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";
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

test("createStudioNodeGroupFromSelection collapses selection and infers default sockets", () => {
  const a = makeNumberNode("a", 100);
  const b = makeNumberNode("b", 280);
  const groupId = "group_test";
  const { groupNode, subgraph } = createStudioNodeGroupFromSelection(
    groupId,
    [a, b],
    [],
    [a, b],
  );
  assert.equal(groupNode.type, "studio-node-group");
  assert.equal(subgraph.nodes.filter((n) => n.type === "studio").length, 2);
  assert.ok(subgraph.interface.inputs.length >= 1);
  assert.ok(subgraph.interface.outputs.length >= 1);
});

test("flattenFlowGraphForEvaluation inlines grouped nodes for simulation", () => {
  const a = makeNumberNode("a", 100);
  a.selected = false;
  const b = makeNumberNode("b", 280);
  b.selected = false;
  const groupId = "group_flat";
  const { groupNode, subgraph } = createStudioNodeGroupFromSelection(
    groupId,
    [b],
    [],
    [a, b],
  );
  const rootNodes = [a, groupNode];
  const subgraphs = { [groupId]: subgraph };
  const flat = flattenFlowGraphForEvaluation(rootNodes, [], subgraphs);
  assert.ok(flat.nodes.some((n) => n.id.includes("b")));
  assert.equal(flat.nodes.filter((n) => n.type === "studio-node-group").length, 0);
});

function makeAnimationClipNode(id: string, x: number): StudioNode {
  return {
    id,
    type: "studio",
    position: { x, y: 120 },
    data: {
      nodeId: "animation-clip",
      label: "Animation Clip",
      category: "scene",
      defaultConfig: { speed: 1 },
      inputHandles: [{ id: "speed", portType: "number", label: "Speed" }],
      outputType: "glbAnimation",
    },
    selected: true,
  };
}

test("inferGroupInterface merges shared external source into one group input", () => {
  const route = {
    id: "route_1",
    type: "studio-reroute",
    position: { x: 40, y: 120 },
    data: { socketType: "number" },
  };
  const clipA = makeAnimationClipNode("clip_a", 160);
  const clipB = makeAnimationClipNode("clip_b", 320);
  const edges: Edge[] = [
    {
      id: "e_a",
      source: "route_1",
      target: "clip_a",
      sourceHandle: "out",
      targetHandle: "speed",
    },
    {
      id: "e_b",
      source: "route_1",
      target: "clip_b",
      sourceHandle: "out",
      targetHandle: "speed",
    },
  ];
  const groupId = "group_fanout";
  const { groupNode, subgraph } = createStudioNodeGroupFromSelection(
    groupId,
    [clipA, clipB],
    edges,
    [route, clipA, clipB],
  );

  assert.equal(subgraph.interface.inputs.length, 1);
  assert.equal(subgraph.interface.inputs[0]?.label, "Speed");

  const inputSocketId = subgraph.interface.inputs[0]!.id;
  const boundaryInEdges = subgraph.edges.filter(
    (e) => e.source === `${groupId}_input` && e.sourceHandle === inputSocketId,
  );
  assert.equal(boundaryInEdges.length, 2);

  const { edges: parentEdges } = rewireParentGraphForStudioGroup(
    [route, clipA, clipB],
    edges,
    groupNode,
    new Set(["clip_a", "clip_b"]),
    subgraph.interface,
  );
  const routeToGroup = parentEdges.filter(
    (e) => e.source === "route_1" && e.target === groupId,
  );
  assert.equal(routeToGroup.length, 1);
});

test("buildStudioNodeGroupHostLiveFields surfaces wired number input on collapsed shell", () => {
  const source = makeNumberNode("num_src", 40);
  const inner = makeNumberNode("inner", 200);
  const groupId = "group_live";
  const { groupNode, subgraph } = createStudioNodeGroupFromSelection(
    groupId,
    [inner],
    [],
    [inner],
  );
  const inputSocketId = subgraph.interface.inputs[0]!.id;
  const parentEdges: Edge[] = [
    {
      id: "e_in",
      source: source.id,
      target: groupId,
      targetHandle: inputSocketId,
    },
  ];
  const pinValues = new Map<string, unknown>([
    [studioFlowPinKey(source.id, "out"), 2.5],
  ]);
  const flat = flattenFlowGraphForEvaluation([source, groupNode], parentEdges, {
    [groupId]: subgraph,
  });
  const live = buildStudioNodeGroupHostLiveFields({
    hostNodeId: groupId,
    subgraphKey: groupId,
    iface: subgraph.interface,
    parentEdges,
    subgraph,
    flattenedEdges: flat.edges,
    pinValues,
  });
  assert.equal(live.liveNumberByHandle?.[inputSocketId], 2.5);
});
