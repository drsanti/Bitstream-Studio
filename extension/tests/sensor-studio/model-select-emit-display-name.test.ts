import assert from "node:assert/strict";
import test from "node:test";

import type { StudioAssetDescriptor } from "../../src/webview/sensor-studio/features/asset-browser/studio-asset.types";
import {
  modelSelectEmitDisplayName,
  modelUrlSocketDisplayLabel,
} from "../../src/webview/sensor-studio/features/editor/nodes/animation/model-select-emit-display-name";

const DESCRIPTORS: readonly StudioAssetDescriptor[] = [
  {
    id: "tesa-drone",
    label: "tesa-drone",
    category: "model",
    source: "catalog",
    url: "/assets/models/tesa-drone.glb",
  },
];

test("modelSelectEmitDisplayName prefers catalog label over raw URL", () => {
  const label = modelSelectEmitDisplayName(
    {
      selectedStudioAssetId: "tesa-drone",
      selectedModelUrl: "file:///C:/long/path/tesa-drone.glb",
    },
    DESCRIPTORS,
  );
  assert.equal(label, "tesa-drone");
});

test("modelSelectEmitDisplayName falls back to filename when catalog is unknown", () => {
  const label = modelSelectEmitDisplayName(
    {
      selectedStudioAssetId: "",
      selectedModelUrl: "https://cdn.example.com/models/custom-bot.glb",
    },
    [],
  );
  assert.equal(label, "custom-bot");
});

test("modelUrlSocketDisplayLabel strips path and extension from relative model URLs", () => {
  assert.equal(
    modelUrlSocketDisplayLabel("models/tesa-drone/tesa-drone.glb"),
    "tesa-drone",
  );
});

test("modelUrlSocketDisplayLabel prefers catalog label when the URL matches", () => {
  assert.equal(
    modelUrlSocketDisplayLabel("/assets/models/tesa-drone.glb", DESCRIPTORS),
    "tesa-drone",
  );
});

test("modelSelectEmitDisplayName returns empty when no model is selected", () => {
  assert.equal(modelSelectEmitDisplayName({}, DESCRIPTORS), "");
});
