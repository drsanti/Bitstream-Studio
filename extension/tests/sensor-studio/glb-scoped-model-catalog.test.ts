import assert from "node:assert/strict";
import test from "node:test";

import type { StudioAssetDescriptor } from "../../src/webview/sensor-studio/features/asset-browser/studio-asset.types";
import { STUDIO_MODEL_SELECT_CUSTOM } from "../../src/webview/sensor-studio/features/asset-browser/studio-model-scene-bindings";
import {
  readGlbScopedModelCatalogSelectValue,
  resolveGlbScopedNodeGltfFetchUrl,
} from "../../src/webview/sensor-studio/features/editor/model/glb-scoped-model-catalog";
import { STUDIO_SOURCE_MODEL_NODE_ID_KEY } from "../../src/webview/sensor-studio/features/editor/model/model-generated-bindings";

const TESA_DESCRIPTOR: StudioAssetDescriptor = {
  id: "tesa-drone",
  label: "TESA Drone",
  category: "model",
  source: "catalog",
  url: "https://cdn.example.com/models/tesa-drone.glb",
};

test("readGlbScopedModelCatalogSelectValue reads scoped model-select catalog id", () => {
  const nodes = [
    {
      id: "m1",
      data: {
        nodeId: "model-select",
        defaultConfig: {
          selectedStudioAssetId: "tesa-drone",
          selectedModelUrl: "models/tesa-drone/tesa-drone.glb",
        },
      },
    },
    {
      id: "spin-1",
      data: {
        nodeId: "part-spin",
        defaultConfig: { [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: "m1" },
      },
    },
  ];
  assert.equal(
    readGlbScopedModelCatalogSelectValue(
      "spin-1",
      nodes[1]!.data.defaultConfig,
      nodes,
      [],
      [TESA_DESCRIPTOR],
    ),
    "tesa-drone",
  );
});

test("readGlbScopedModelCatalogSelectValue falls back to inline node catalog fields", () => {
  assert.equal(
    readGlbScopedModelCatalogSelectValue(
      "spin-1",
      {
        selectedStudioAssetId: "tesa-drone",
        selectedModelUrl: "https://cdn.example.com/models/tesa-drone.glb",
      },
      [],
      [],
      [TESA_DESCRIPTOR],
    ),
    "tesa-drone",
  );
});

test("readGlbScopedModelCatalogSelectValue returns custom when unscoped", () => {
  assert.equal(
    readGlbScopedModelCatalogSelectValue("spin-1", {}, [], [], []),
    STUDIO_MODEL_SELECT_CUSTOM,
  );
});

test("resolveGlbScopedNodeGltfFetchUrl resolves inline absolute model url", () => {
  const url = resolveGlbScopedNodeGltfFetchUrl(
    "spin-1",
    {
      selectedStudioAssetId: "tesa-drone",
      selectedModelUrl: "https://cdn.example.com/models/tesa-drone.glb",
    },
    [],
    [],
    [TESA_DESCRIPTOR],
  );
  assert.equal(url, "https://cdn.example.com/models/tesa-drone.glb");
});
