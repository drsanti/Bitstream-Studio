import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFlowClipboardPayload,
  remapFlowPaste,
} from "../../src/webview/sensor-studio/features/editor/clipboard/flow-clipboard";
import { createStudioNodeGroupFromSelection } from "../../src/webview/sensor-studio/features/editor/subgraphs/create-studio-node-group";
import { dissolveStudioNodeGroupInParent } from "../../src/webview/sensor-studio/features/editor/subgraphs/dissolve-studio-node-group";
import { attachSubgraphsForPastedNodeGroups } from "../../src/webview/sensor-studio/features/editor/subgraphs/paste-subgraph-groups";
import type { FlowGraphNode, StudioNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

function studioNode(id: string, x: number, selected = false): StudioNode {
  return {
    id,
    type: "studio",
    position: { x, y: 80 },
    selected,
    data: {
      nodeId: "number-constant",
      label: "Number",
      category: "constants",
      defaultConfig: { value: 1 },
      outputType: "number",
    },
  };
}

describe("subgraph clipboard", () => {
  it("buildFlowClipboardPayload includes nested subgraph for node groups", () => {
    const inner = studioNode("inner", 200);
    inner.selected = true;
    const outer = studioNode("outer", 100);
    const groupId = "group_clip";
    const { groupNode, subgraph } = createStudioNodeGroupFromSelection(
      groupId,
      [inner],
      [],
      [inner, outer],
    );
    groupNode.selected = true;
    const subgraphs = { [groupId]: subgraph };
    const payload = buildFlowClipboardPayload([groupNode as FlowGraphNode], [], subgraphs);
    assert.equal(payload.nodes.length, 1);
    assert.equal(payload.nodes[0]?.type, "studio-node-group");
    assert.ok(payload.subgraphs?.[groupId] != null);
    assert.equal(payload.subgraphs?.[groupId]?.nodes.length, subgraph.nodes.length);
  });

  it("attachSubgraphsForPastedNodeGroups deep-clones subgraph onto new host id", () => {
    const inner = studioNode("inner", 200);
    const groupId = "group_src";
    const { groupNode, subgraph } = createStudioNodeGroupFromSelection(
      groupId,
      [inner],
      [],
      [inner],
    );
    const clipboard = { [groupId]: subgraph };
    const { nodes: remapped, idMap } = remapFlowPaste({
      marker: "sensor-studio-flow-clipboard",
      version: 1,
      nodes: [groupNode as FlowGraphNode],
      edges: [],
      subgraphs: clipboard,
    });
    const { nodes, subgraphs } = attachSubgraphsForPastedNodeGroups(
      remapped,
      {},
      clipboard,
      idMap,
    );
    const pastedHost = nodes[0];
    assert.equal(pastedHost?.type, "studio-node-group");
    const newKey = (pastedHost?.data as { subgraphId: string }).subgraphId;
    assert.equal(newKey, pastedHost?.id);
    assert.ok(subgraphs[newKey] != null);
    assert.notEqual(subgraphs[newKey], clipboard[groupId]);
    assert.equal(subgraphs[newKey]?.nodes.filter((n) => n.type === "studio").length, 1);
  });
});

describe("dissolveStudioNodeGroupInParent", () => {
  it("expands group shell and removes subgraph when sole host", () => {
    const a = studioNode("a", 100);
    const b = studioNode("b", 280);
    b.selected = true;
    const groupId = "group_dissolve";
    const { groupNode, subgraph } = createStudioNodeGroupFromSelection(
      groupId,
      [b],
      [],
      [a, b],
    );
    const subgraphs = { [groupId]: subgraph };
    const parentNodes = [a, groupNode];
    const result = dissolveStudioNodeGroupInParent(
      parentNodes,
      [],
      groupNode,
      subgraphs,
      parentNodes,
    );
    assert.ok(result != null);
    assert.equal(result.nodes.filter((n) => n.type === "studio-node-group").length, 0);
    assert.ok(result.nodes.some((n) => n.id === "b" || n.id.startsWith("ung_")));
    assert.equal(result.subgraphs[groupId], undefined);
  });
});
