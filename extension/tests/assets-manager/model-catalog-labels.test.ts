import assert from "node:assert/strict";
import test from "node:test";
import { inferModelAssetSource } from "../../src/webview/assets-manager/registry/inferModelAssetSource.js";
import type { ModelEntry } from "../../src/webview/model-catalog/modelCatalog-types.js";
import { resolveModelCatalogEntryLabels } from "../../src/webview/model-catalog/modelCatalogEntryLabels.js";

function entry(partial: Partial<ModelEntry> & Pick<ModelEntry, "dedupeKey">): ModelEntry {
  return {
    id: "id",
    name: "name",
    modelCategory: "Uncategorized",
    fileType: "glb",
    url: "https://example.com/a.glb",
    catalogCategory: "packaged",
    ...partial,
  };
}

test("resolveModelCatalogEntryLabels uses filename for multi-file folders", () => {
  assert.deepEqual(
    resolveModelCatalogEntryLabels({
      nameWithoutExt: "basic_scene",
      parentDir: "scenes",
    }),
    { name: "Basic Scene", modelCategory: "Scenes" },
  );
});

test("resolveModelCatalogEntryLabels keeps folder name when file matches folder", () => {
  assert.deepEqual(
    resolveModelCatalogEntryLabels({
      nameWithoutExt: "psoc-e84-ai",
      parentDir: "psoc-e84-ai",
    }),
    { name: "Psoc E84 Ai", modelCategory: "Uncategorized" },
  );
});

test("resolveModelCatalogEntryLabels prefers metadata name and category", () => {
  assert.deepEqual(
    resolveModelCatalogEntryLabels({
      metadataName: "E84 board",
      metadataCategory: "Hardware",
      nameWithoutExt: "psoc-e84-ai",
      parentDir: "psoc-e84-ai",
    }),
    { name: "E84 board", modelCategory: "Hardware" },
  );
});

test("inferModelAssetSource marks legacy static repo mirror as bundled when scan enabled", () => {
  assert.equal(
    inferModelAssetSource(
      entry({ dedupeKey: "mirror:scenes/basic_scene.glb", catalogCategory: "packaged" }),
    ),
    "bundled",
  );
});

test("inferModelAssetSource marks free pack runtime paths as pack", () => {
  assert.equal(
    inferModelAssetSource(
      entry({
        dedupeKey: "free/models/scenes/basic_scene.glb",
        catalogCategory: "downloaded",
        modelSource: "dynamic",
      }),
    ),
    "pack",
  );
});

test("inferModelAssetSource marks model loader downloads as on-device", () => {
  assert.equal(
    inferModelAssetSource(
      entry({
        dedupeKey: "tesaiot/models/PDM-DEV-902720/PDM-DEV-902720_model.glb",
        catalogCategory: "downloaded",
        modelSource: "dynamic",
      }),
    ),
    "downloaded",
  );
});
