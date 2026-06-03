import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collectDownstreamEdgeIds } from "../../src/webview/sensor-studio/features/editor/edges/flow-edge-downstream-path";

describe("flow-edge-downstream-path", () => {
  const edges = [
    { id: "e1", source: "a", target: "b" },
    { id: "e2", source: "b", target: "c" },
    { id: "e3", source: "c", target: "d" },
    { id: "e4", source: "x", target: "y" },
  ];

  it("includes the seed edge and downstream chain", () => {
    const ids = collectDownstreamEdgeIds("e1", edges);
    assert.deepEqual([...ids].sort(), ["e1", "e2", "e3"]);
  });

  it("returns only the seed when nothing flows out of target", () => {
    const ids = collectDownstreamEdgeIds("e3", edges);
    assert.deepEqual([...ids], ["e3"]);
  });

  it("returns empty set for unknown edge id", () => {
    const ids = collectDownstreamEdgeIds("missing", edges);
    assert.equal(ids.size, 0);
  });
});
