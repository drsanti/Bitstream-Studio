import assert from "node:assert/strict";
import test from "node:test";

import type { StudioAssetDescriptor } from "../../src/webview/sensor-studio/features/asset-browser/studio-asset.types";
import { STUDIO_MODEL_SELECT_CUSTOM } from "../../src/webview/sensor-studio/features/asset-browser/studio-model-scene-bindings";
import { STUDIO_SOURCE_MODEL_NODE_ID_KEY } from "../../src/webview/sensor-studio/features/editor/model/model-generated-bindings";
import {
  readAnimationClipModelCatalogSelectValue,
  resolveAnimationClipGltfFetchUrl,
} from "../../src/webview/sensor-studio/features/editor/nodes/animation/animation-clip-model-catalog";

const TESA_DESCRIPTOR: StudioAssetDescriptor = {
  id: "tesa-drone",
  label: "TESA Drone",
  category: "model",
  source: "catalog",
  url: "https://cdn.example.com/models/tesa-drone.glb",
};

test("readAnimationClipModelCatalogSelectValue reads scoped model-select catalog id", () => {
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
      id: "clip-1",
      data: {
        nodeId: "animation-clip",
        defaultConfig: { [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: "m1" },
      },
    },
  ];
  assert.equal(
    readAnimationClipModelCatalogSelectValue(
      "clip-1",
      nodes[1]!.data.defaultConfig,
      nodes,
      [],
      [TESA_DESCRIPTOR],
    ),
    "tesa-drone",
  );
});

test("readAnimationClipModelCatalogSelectValue falls back to inline clip catalog fields", () => {
  assert.equal(
    readAnimationClipModelCatalogSelectValue(
      "clip-1",
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

test("readAnimationClipModelCatalogSelectValue returns custom when unscoped", () => {
  assert.equal(
    readAnimationClipModelCatalogSelectValue("clip-1", {}, [], [], []),
    STUDIO_MODEL_SELECT_CUSTOM,
  );
});

test("resolveAnimationClipGltfFetchUrl resolves inline absolute clip model url", () => {
  const url = resolveAnimationClipGltfFetchUrl(
    "clip-1",
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
