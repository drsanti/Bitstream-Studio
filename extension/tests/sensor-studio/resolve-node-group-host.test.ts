import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveNodeGroupHostId } from "../../src/webview/sensor-studio/features/editor/subgraphs/resolve-node-group-host";
import { defaultGroupInterface } from "../../src/webview/sensor-studio/features/editor/subgraphs/studio-subgraph.types";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

test("resolveNodeGroupHostId finds nested group host when boundary selected inside inner subgraph", () => {
  const innerSubgraphId = "group_inner";
  const outerSubgraphId = "group_outer";

  const innerHost: FlowGraphNode = {
    id: "shell_inner",
    type: "studio-node-group",
    position: { x: 200, y: 100 },
    data: { subgraphId: innerSubgraphId, graphTitle: "Inner" },
  };

  const outerSubgraph = {
    nodes: [
      { id: `${outerSubgraphId}_input`, type: "studio-group-input", position: { x: 0, y: 0 }, data: {} },
      innerHost,
      { id: `${outerSubgraphId}_output`, type: "studio-group-output", position: { x: 400, y: 0 }, data: {} },
    ],
    edges: [],
    interface: defaultGroupInterface(),
    graphTitle: "Outer",
  };

  const boundaryInput = {
    id: `${innerSubgraphId}_input`,
    type: "studio-group-input",
    position: { x: 40, y: 120 },
    data: { role: "input" },
  };

  const subgraphs = {
    [outerSubgraphId]: outerSubgraph,
    [innerSubgraphId]: {
      nodes: [boundaryInput],
      edges: [],
      interface: defaultGroupInterface(),
      graphTitle: "Inner",
    },
  };

  const resolved = resolveNodeGroupHostId(
    boundaryInput,
    [],
    innerSubgraphId,
    subgraphs,
  );

  assert.ok(resolved != null);
  assert.equal(resolved.hostNodeId, "shell_inner");
  assert.equal(resolved.focusedBoundaryRole, "input");
  assert.equal(resolved.data.graphTitle, "Inner");
});
