import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyParallelEdgeOffsets } from "../../src/webview/sensor-studio/features/editor/edges/flow-edge-parallel-offset";

describe("flow-edge-parallel-offset", () => {
  it("assigns symmetric offsets for two parallel wires", () => {
    const edges = applyParallelEdgeOffsets(
      [
        { id: "e1", source: "a", target: "b" },
        { id: "e2", source: "a", target: "b" },
      ],
      10,
    );
    const byId = Object.fromEntries(edges.map((e) => [e.id, e.pathOptions?.offset]));
    assert.equal(byId.e1, -5);
    assert.equal(byId.e2, 5);
  });

  it("leaves edges unchanged when spacing is 0", () => {
    const input = [{ id: "e1", source: "a", target: "b" }];
    const out = applyParallelEdgeOffsets(input, 0);
    assert.equal(out[0]?.pathOptions?.offset, undefined);
  });
});
