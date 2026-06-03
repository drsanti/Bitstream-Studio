import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyEdgeBusLaneOffsets } from "../../src/webview/sensor-studio/features/editor/edges/flow-edge-bus-lane-offset";

describe("flow-edge-bus-lane-offset", () => {
  const nodes = [
    { id: "src", position: { x: 0, y: 0 }, data: {}, width: 100, height: 40 },
    { id: "low", position: { x: 200, y: 100 }, data: {}, width: 100, height: 40 },
    { id: "mid", position: { x: 200, y: 50 }, data: {}, width: 100, height: 40 },
    { id: "high", position: { x: 200, y: 0 }, data: {}, width: 100, height: 40 },
  ];
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  it("orders fan-out by target Y when sort is vertical", () => {
    const edges = [
      { id: "e-low", source: "src", target: "low", sourceHandle: "out" },
      { id: "e-mid", source: "src", target: "mid", sourceHandle: "out" },
      { id: "e-high", source: "src", target: "high", sourceHandle: "out" },
    ];
    const out = applyEdgeBusLaneOffsets(edges, nodeById, 10, "vertical");
    const byId = Object.fromEntries(out.map((e) => [e.id, e.pathOptions?.offset]));
    assert.equal(byId["e-high"], -10);
    assert.equal(byId["e-mid"], undefined);
    assert.equal(byId["e-low"], 10);
  });
});
