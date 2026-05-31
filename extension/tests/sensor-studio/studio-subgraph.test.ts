import assert from "node:assert/strict";
import { test } from "node:test";
import { createStudioNodeGroupFromSelection } from "../../src/webview/sensor-studio/features/editor/subgraphs/create-studio-node-group";
import { flattenFlowGraphForEvaluation } from "../../src/webview/sensor-studio/features/editor/subgraphs/flatten-flow-graph-for-evaluation";
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
