import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyEdgeBundleOffsets } from "../../src/webview/sensor-studio/features/editor/edges/flow-edge-bundle-offset";
import { applyParallelEdgeOffsets } from "../../src/webview/sensor-studio/features/editor/edges/flow-edge-parallel-offset";

describe("flow-edge-bundle-offset", () => {
  const fanOutEdges = [
    { id: "e1", source: "a", target: "b", sourceHandle: "out" },
    { id: "e2", source: "a", target: "c", sourceHandle: "out" },
    { id: "e3", source: "a", target: "d", sourceHandle: "out" },
  ];

  it("fans out wires from the same source socket", () => {
    const out = applyEdgeBundleOffsets(fanOutEdges, "fanOut", 10);
    const byId = Object.fromEntries(out.map((e) => [e.id, e.pathOptions?.offset]));
    assert.equal(byId.e1, -10);
    assert.equal(byId.e2, undefined);
    assert.equal(byId.e3, 10);
  });

  it("fans in wires to the same target socket", () => {
    const edges = [
      { id: "e1", source: "a", target: "z", targetHandle: "in" },
      { id: "e2", source: "b", target: "z", targetHandle: "in" },
    ];
    const out = applyEdgeBundleOffsets(edges, "fanIn", 8);
    assert.equal(out[0]?.pathOptions?.offset, -4);
    assert.equal(out[1]?.pathOptions?.offset, 4);
  });

  it("stacks bundle offset on parallel pair offset", () => {
    const pair = [
      { id: "e1", source: "a", target: "b" },
      { id: "e2", source: "a", target: "b" },
    ];
    const parallel = applyParallelEdgeOffsets(pair, 10);
    const bundled = applyEdgeBundleOffsets(parallel, "fanOut", 6);
    const byId = Object.fromEntries(bundled.map((e) => [e.id, e.pathOptions?.offset]));
    assert.equal(byId.e1, -5 - 3);
    assert.equal(byId.e2, 5 + 3);
  });
});
