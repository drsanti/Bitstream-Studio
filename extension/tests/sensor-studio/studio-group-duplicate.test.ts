import assert from "node:assert/strict";
import { test } from "node:test";
import { createStudioNodeGroupFromSelection } from "../../src/webview/sensor-studio/features/editor/subgraphs/create-studio-node-group";
import {
  countStudioSubgraphHosts,
  duplicateStudioGroupDeepCopy,
  duplicateStudioGroupLinked,
} from "../../src/webview/sensor-studio/features/editor/subgraphs/duplicate-group-instance";
import type { StudioNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

function studioNode(id: string, x = 100): StudioNode {
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
    selected: false,
  };
}

test("duplicateStudioGroupLinked shares subgraphId across hosts", () => {
  const inner = studioNode("inner");
  const groupId = "group_link_src";
  const { groupNode, subgraph } = createStudioNodeGroupFromSelection(
    groupId,
    [inner],
    [],
    [inner],
  );
  const subgraphs = { [groupId]: subgraph };

  const linked = duplicateStudioGroupLinked(groupNode, subgraphs);
  assert.ok(linked != null);
  assert.notEqual(linked.hostNode.id, groupNode.id);
  assert.equal((linked.hostNode.data as { subgraphId: string }).subgraphId, groupId);
  assert.equal(linked.subgraphs, subgraphs);
  assert.equal(countStudioSubgraphHosts(groupId, [groupNode, linked.hostNode], subgraphs), 2);
});

test("duplicateStudioGroupDeepCopy clones subgraph under new host id", () => {
  const inner = studioNode("inner");
  const groupId = "group_deep_src";
  const { groupNode, subgraph } = createStudioNodeGroupFromSelection(
    groupId,
    [inner],
    [],
    [inner],
  );
  const subgraphs = { [groupId]: subgraph };

  const copied = duplicateStudioGroupDeepCopy(groupNode, subgraphs);
  assert.ok(copied != null);
  const newKey = copied.hostNode.id;
  assert.equal((copied.hostNode.data as { subgraphId: string }).subgraphId, newKey);
  assert.ok(copied.subgraphs[newKey] != null);
  assert.notEqual(copied.subgraphs[newKey], subgraph);
  assert.equal(copied.subgraphs[newKey]?.nodes.filter((n) => n.type === "studio").length, 1);
  assert.equal(countStudioSubgraphHosts(groupId, [groupNode], copied.subgraphs), 1);
});
