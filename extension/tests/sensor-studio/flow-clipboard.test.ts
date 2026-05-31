import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFlowClipboardPayload,
  parseFlowClipboard,
  remapFlowPaste,
  serializeFlowClipboard,
} from "../../src/webview/sensor-studio/features/editor/clipboard/flow-clipboard";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

function studioNode(id: string, selected = false): FlowGraphNode {
  return {
    id,
    type: "studio",
    position: { x: 10, y: 20 },
    selected,
    data: {
      nodeId: "number-source",
      label: "Number",
      category: "input",
      config: { value: 1 },
      outputType: "number",
    },
  };
}

describe("flow-clipboard", () => {
  it("exports selected nodes and internal edges only", () => {
    const nodes = [studioNode("a", true), studioNode("b", false), studioNode("c", true)];
    const edges = [
      { id: "e1", source: "a", target: "c" },
      { id: "e2", source: "b", target: "c" },
      { id: "e3", source: "a", target: "b" },
    ];
    const payload = buildFlowClipboardPayload(nodes, edges);
    assert.equal(payload.nodes.length, 2);
    assert.deepEqual(
      payload.nodes.map((n) => n.id).sort(),
      ["a", "c"],
    );
    assert.equal(payload.edges.length, 1);
    assert.equal(payload.edges[0]?.id, "e1");
  });

  it("round-trips serialize/parse and remaps ids on paste", () => {
    const nodes = [studioNode("a", true)];
    const payload = buildFlowClipboardPayload(nodes, []);
    const text = serializeFlowClipboard(payload);
    const parsed = parseFlowClipboard(text);
    assert.ok(parsed != null);
    assert.equal(parsed.nodes.length, 1);

    const invalid = parseFlowClipboard('{"marker":"other"}');
    assert.equal(invalid, null);

    const { nodes: pasted, idMap } = remapFlowPaste(parsed!);
    assert.equal(pasted.length, 1);
    assert.notEqual(pasted[0]?.id, "a");
    assert.equal(idMap.get("a"), pasted[0]?.id);
    assert.equal(pasted[0]?.position.x, 58);
    assert.equal(pasted[0]?.position.y, 68);
  });
});
