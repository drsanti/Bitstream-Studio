import assert from "node:assert/strict";
import { test } from "node:test";
import { formatGroupBreadcrumbLabel } from "../../src/webview/sensor-studio/features/editor/subgraphs/studio-group-breadcrumb-label";
import { defaultGroupInterface } from "../../src/webview/sensor-studio/features/editor/subgraphs/studio-subgraph.types";

test("formatGroupBreadcrumbLabel includes socket counts for group graphs", () => {
  const iface = defaultGroupInterface();
  const label = formatGroupBreadcrumbLabel("group_a", {
    group_a: {
      nodes: [],
      edges: [],
      interface: {
        inputs: [...iface.inputs, { ...iface.inputs[0]!, id: "in2", label: "B" }],
        outputs: iface.outputs,
      },
      graphTitle: "Drone IK",
    },
  });
  assert.equal(label, "Drone IK (2 in / 1 out)");
});
