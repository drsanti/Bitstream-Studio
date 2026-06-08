import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  graphHasDashboardOutputNode,
  readDashboardStructuralRevision,
} from "../../src/webview/sensor-studio/core/dashboard/dashboard-structural-revision.ts";

describe("dashboard-structural-revision", () => {
  it("detects dashboard-output in the graph", () => {
    const nodes = [
      {
        id: "out",
        type: "studio",
        position: { x: 0, y: 0 },
        data: { nodeId: "dashboard-output", defaultConfig: {} },
      },
    ];
    assert.equal(graphHasDashboardOutputNode(nodes as never), true);
  });

  it("ignores live telemetry when building structural revision", () => {
    const gaugeA = {
      id: "g1",
      type: "studio",
      position: { x: 0, y: 0 },
      data: {
        nodeId: "dashboard-gauge",
        defaultConfig: { placement: { row: 1, column: 1, rowSpan: 1, columnSpan: 1 } },
        liveValue: 0.1,
      },
    };
    const gaugeB = {
      ...gaugeA,
      data: { ...gaugeA.data, liveValue: 0.9 },
    };
    assert.equal(
      readDashboardStructuralRevision([gaugeA] as never, []),
      readDashboardStructuralRevision([gaugeB] as never, []),
    );
  });
});
