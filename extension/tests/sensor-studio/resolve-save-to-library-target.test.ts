import assert from "node:assert/strict";
import test from "node:test";

import { resolveSaveToLibraryTarget } from "../../src/webview/sensor-studio/features/editor/flow-library/resolve-save-to-library-target";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

function node(id: string, selected: boolean, type = "studio-flow-node"): FlowGraphNode {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    selected,
    data: { nodeId: "constant-number", label: id, category: "utility", defaultConfig: {} },
  } as FlowGraphNode;
}

function groupNode(id: string, selected: boolean): FlowGraphNode {
  return {
    id,
    type: "studio-node-group",
    position: { x: 0, y: 0 },
    selected,
    data: { label: "Group", subgraphId: "sg-1" },
  } as FlowGraphNode;
}

test("resolveSaveToLibraryTarget returns flow-full when nothing is selected", () => {
  assert.equal(resolveSaveToLibraryTarget([node("a", false), node("b", false)]), "flow-full");
});

test("resolveSaveToLibraryTarget returns group when one group is selected", () => {
  assert.equal(resolveSaveToLibraryTarget([groupNode("g1", true)]), "group");
});

test("resolveSaveToLibraryTarget returns flow-partial for multi or non-group selection", () => {
  assert.equal(resolveSaveToLibraryTarget([node("a", true), node("b", true)]), "flow-partial");
  assert.equal(resolveSaveToLibraryTarget([node("a", true)]), "flow-partial");
});
