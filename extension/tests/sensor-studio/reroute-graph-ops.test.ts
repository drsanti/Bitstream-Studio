import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyRerouteBridgeOnEdgeRemoves,
  bridgeReroutesOnNodeRemove,
  removeFlowNodesFromGraph,
  splitEdgeWithReroute,
} from "../../src/webview/sensor-studio/features/editor/layout/reroute-graph-ops";
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

  it("bridges upstream to downstream when a wired reroute is removed", () => {
    const nodes = [numberSource("src"), numberSink("dst")];
    const split = splitEdgeWithReroute("wire-1", { x: 100, y: 50 }, nodes, [
      { id: "wire-1", source: "src", target: "dst", label: "number" },
    ]);
    assert.ok(split != null);
    const bridged = bridgeReroutesOnNodeRemove([split.rerouteId], split.nodes, split.edges);
    assert.equal(bridged.length, 1);
    assert.equal(bridged[0]?.source, "src");
    assert.equal(bridged[0]?.target, "dst");
    assert.equal(bridged[0]?.label, "number");
  });

  it("applyRerouteBridgeOnEdgeRemoves reconnects when both arms delete together", () => {
    const nodes = [numberSource("src"), numberSink("dst")];
    const split = splitEdgeWithReroute("wire-1", { x: 100, y: 50 }, nodes, [
      { id: "wire-1", source: "src", target: "dst", label: "number" },
    ]);
    assert.ok(split != null);
    const inEdge = split.edges.find((e) => e.target === split.rerouteId)!;
    const outEdge = split.edges.find((e) => e.source === split.rerouteId)!;
    const result = applyRerouteBridgeOnEdgeRemoves(
      [
        { type: "remove", id: inEdge.id },
        { type: "remove", id: outEdge.id },
      ],
      split.nodes,
      split.edges,
    );
    assert.equal(result.changes.length, 0);
    assert.equal(result.edges.length, 1);
    assert.equal(result.edges[0]?.source, "src");
    assert.equal(result.edges[0]?.target, "dst");
  });

  it("removeFlowNodesFromGraph bridges reroutes and drops other node wires", () => {
    const nodes = [numberSource("src"), numberSink("dst"), numberSource("other")];
    const split = splitEdgeWithReroute("wire-1", { x: 100, y: 50 }, nodes, [
      { id: "wire-1", source: "src", target: "dst", label: "number" },
      { id: "wire-2", source: "other", target: "dst", label: "number" },
    ]);
    assert.ok(split != null);
    const removed = removeFlowNodesFromGraph([split.rerouteId], split.nodes, split.edges);
    assert.equal(removed.nodes.length, 3);
    assert.equal(removed.edges.some((e) => e.source === "src" && e.target === "dst"), true);
    assert.equal(removed.edges.some((e) => e.source === split.rerouteId), false);

    const removedOther = removeFlowNodesFromGraph(["other"], removed.nodes, removed.edges);
    assert.equal(removedOther.nodes.length, 2);
    assert.equal(removedOther.edges.some((e) => e.source === "other"), false);
  });
});
