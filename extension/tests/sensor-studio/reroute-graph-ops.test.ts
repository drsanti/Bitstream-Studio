import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { splitEdgeWithReroute } from "../../src/webview/sensor-studio/features/editor/layout/reroute-graph-ops";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

function numberSource(id: string): FlowGraphNode {
  return {
    id,
    type: "studio",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "number-source",
      label: "Number",
      category: "input",
      config: { value: 1 },
      outputType: "number",
    },
  };
}

function numberSink(id: string): FlowGraphNode {
  return {
    id,
    type: "studio",
    position: { x: 200, y: 0 },
    data: {
      nodeId: "number-display",
      label: "Display",
      category: "output",
      config: {},
      inputType: "number",
    },
  };
}

describe("reroute-graph-ops", () => {
  it("splits an edge with a typed reroute and two new wires", () => {
    const nodes = [numberSource("src"), numberSink("dst")];
    const edges = [{ id: "wire-1", source: "src", target: "dst", label: "number" }];
    const split = splitEdgeWithReroute("wire-1", { x: 100, y: 50 }, nodes, edges);
    assert.ok(split != null);
    assert.equal(split.nodes.length, 3);
    assert.equal(split.edges.length, 2);
    assert.equal(split.edges.every((e) => e.label === "number"), true);
    const reroute = split.nodes.find((n) => n.id === split.rerouteId);
    assert.equal(reroute?.type, "studio-reroute");
    assert.equal(reroute?.data.socketType, "number");
    assert.equal(
      split.edges.some((e) => e.source === "src" && e.target === split.rerouteId),
      true,
    );
    assert.equal(
      split.edges.some((e) => e.source === split.rerouteId && e.target === "dst"),
      true,
    );
  });

  it("returns null for missing or self-loop edges", () => {
    const nodes = [numberSource("a")];
    assert.equal(
      splitEdgeWithReroute("missing", { x: 0, y: 0 }, nodes, []),
      null,
    );
    assert.equal(
      splitEdgeWithReroute(
        "loop",
        { x: 0, y: 0 },
        nodes,
        [{ id: "loop", source: "a", target: "a" }],
      ),
      null,
    );
  });
});
