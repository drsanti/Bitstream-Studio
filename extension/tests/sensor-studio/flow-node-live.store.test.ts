import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mergeFlowGraphNodesWithLive,
  useFlowNodeLiveStore,
} from "../../src/webview/sensor-studio/features/editor/store/flow-node-live.store.ts";

describe("flow-node-live.store", () => {
  it("applies per-node live patches without touching unrelated nodes", () => {
    useFlowNodeLiveStore.getState().resetAll();
    const changed = useFlowNodeLiveStore.getState().applyTickPatches(
      new Map([
        ["a", { liveValue: 0.5 }],
        ["b", { liveValue: 1 }],
      ]),
    );
    assert.equal(changed, true);
    assert.equal(useFlowNodeLiveStore.getState().byNodeId.a?.liveValue, 0.5);

    const changedAgain = useFlowNodeLiveStore.getState().applyTickPatches(
      new Map([
        ["a", { liveValue: 0.6 }],
        ["b", { liveValue: 1 }],
      ]),
    );
    assert.equal(changedAgain, true);
    assert.equal(useFlowNodeLiveStore.getState().byNodeId.b?.liveValue, 1);
  });

  it("merges live slices into graph nodes for evaluation", () => {
    const nodes = [
      {
        id: "a",
        type: "studio",
        position: { x: 0, y: 0 },
        data: { nodeId: "sine-wave", label: "Sine" },
      },
    ] as const;
    const merged = mergeFlowGraphNodesWithLive(nodes as never, {
      a: { liveValue: -0.25 },
    });
    assert.equal(merged[0]?.data.liveValue, -0.25);
  });
});
