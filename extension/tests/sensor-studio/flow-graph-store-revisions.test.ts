import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  readFlowGraphSocketToolbarRevision,
  readFlowGraphStoreStructuralRevision,
  readSelectedNodesLiveRevision,
} from "../../src/webview/sensor-studio/features/editor/flow-graph-store-revisions.ts";

describe("flow-graph-store-revisions", () => {
  it("ignores liveValue when building structural revision", () => {
    const nodeA = {
      id: "n1",
      type: "studio",
      position: { x: 0, y: 0 },
      data: { nodeId: "sine-wave", liveValue: 0.1 },
    };
    const nodeB = {
      ...nodeA,
      data: { ...nodeA.data, liveValue: 0.9 },
    };
    const edges: never[] = [];
    assert.equal(
      readFlowGraphStoreStructuralRevision([nodeA], edges),
      readFlowGraphStoreStructuralRevision([nodeB], edges),
    );
  });

  it("tracks socket toolbar ui without live telemetry", () => {
    const base = {
      id: "n1",
      type: "studio",
      position: { x: 0, y: 0 },
      data: { nodeId: "sine-wave", ui: { socketsExpanded: true }, liveValue: 0.1 },
    };
    const liveChanged = {
      ...base,
      data: { ...base.data, liveValue: 0.9 },
    };
    const uiChanged = {
      ...base,
      data: { ...base.data, ui: { socketsExpanded: false }, liveValue: 0.9 },
    };
    assert.equal(
      readFlowGraphSocketToolbarRevision([base]),
      readFlowGraphSocketToolbarRevision([liveChanged]),
    );
    assert.notEqual(
      readFlowGraphSocketToolbarRevision([base]),
      readFlowGraphSocketToolbarRevision([uiChanged]),
    );
  });

  it("only bumps selected live revision for selected nodes", () => {
    const nodes = [
      {
        id: "a",
        type: "studio",
        position: { x: 0, y: 0 },
        data: { liveValue: 1 },
      },
      {
        id: "b",
        type: "studio",
        position: { x: 40, y: 0 },
        data: { liveValue: 2 },
      },
    ];
    const none = readSelectedNodesLiveRevision({
      selectedNodeIds: [],
      selectedNodeId: null,
    });
    assert.equal(none, "");

    const selectedA = readSelectedNodesLiveRevision({
      selectedNodeIds: ["a"],
      selectedNodeId: null,
      liveByNodeId: {
        a: { liveValue: 1 },
        b: { liveValue: 2 },
      },
    });
    const stillA = readSelectedNodesLiveRevision({
      selectedNodeIds: ["a"],
      selectedNodeId: null,
      liveByNodeId: {
        a: { liveValue: 1 },
        b: { liveValue: 3 },
      },
    });
    assert.equal(selectedA, stillA);
  });
});
