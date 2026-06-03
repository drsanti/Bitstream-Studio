import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveFlowEdgeMidpointPosition } from "../../src/webview/sensor-studio/features/editor/edges/flow-edge-midpoint";

describe("flow-edge-midpoint", () => {
  it("returns midpoint between node centers", () => {
    const mid = resolveFlowEdgeMidpointPosition(
      [
        { id: "a", position: { x: 0, y: 0 }, data: {}, width: 100, height: 40 },
        { id: "b", position: { x: 200, y: 100 }, data: {}, width: 100, height: 40 },
      ],
      { source: "a", target: "b" },
    );
    assert.deepEqual(mid, { x: 150, y: 70 });
  });
});
