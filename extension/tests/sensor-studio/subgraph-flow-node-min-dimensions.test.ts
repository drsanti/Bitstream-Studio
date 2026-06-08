import assert from "node:assert/strict";
import test from "node:test";

import { resolveSubgraphFlowNodeMinDimensions } from "../../src/webview/sensor-studio/features/editor/layout-nodes/subgraph-flow-node-min-dimensions";

test("resolveSubgraphFlowNodeMinDimensions returns shared floors for group shell and boundary cards", () => {
  const group = resolveSubgraphFlowNodeMinDimensions("node-group");
  const boundary = resolveSubgraphFlowNodeMinDimensions("group-boundary");
  assert.equal(group.minWidth, 168);
  assert.equal(boundary.minWidth, 168);
  assert.equal(group.minHeight, 72);
  assert.equal(boundary.minHeight, 72);
});
