import assert from "node:assert/strict";
import test from "node:test";

import type { StudioAssetDescriptor } from "../../src/webview/sensor-studio/features/asset-browser/studio-asset.types";
import {
  pickDefaultCanvasModelSelectId,
  resolveOutlinerParentModelFlowNodeId,
} from "../../src/webview/sensor-studio/features/editor/model-outliner/model-outliner-scope";

const descriptors: StudioAssetDescriptor[] = [
  {
    id: "tesa-drone",
    label: "TESA Drone",
    category: "model",
    source: "catalog",
    url: "https://cdn.example.com/models/tesa-drone.glb",
  },
];

const nodes = [
  {
    id: "ms-1",
    data: {
      nodeId: "model-select",
      defaultConfig: {
        selectedStudioAssetId: "tesa-drone",
        selectedModelUrl: "models/tesa-drone.glb",
      },
    },
  },
] as const;

test("resolveOutlinerParentModelFlowNodeId resolves canvas scope", () => {
  assert.equal(
    resolveOutlinerParentModelFlowNodeId("canvas-model-select", "ms-1", null, nodes, descriptors),
    "ms-1",
  );
});

test("resolveOutlinerParentModelFlowNodeId resolves catalog scope when model-select matches", () => {
  assert.equal(
    resolveOutlinerParentModelFlowNodeId("catalog-inline", null, "tesa-drone", nodes, descriptors),
    "ms-1",
  );
});

test("pickDefaultCanvasModelSelectId prefers stored id when valid", () => {
  assert.equal(pickDefaultCanvasModelSelectId(nodes, "ms-1"), "ms-1");
  assert.equal(pickDefaultCanvasModelSelectId(nodes, "missing"), "ms-1");
});
