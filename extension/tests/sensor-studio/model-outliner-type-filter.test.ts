import assert from "node:assert/strict";
import test from "node:test";

import {
  countModelOutlinerTypeFilter,
  filterExtractionByType,
  isSceneHierarchyTypeFilter,
  typeFilterUsesFlatExtractList,
} from "../../src/webview/sensor-studio/features/editor/model-outliner/model-outliner-type-filter";
import type { StudioGltfExtractionResult } from "../../src/webview/sensor-studio/features/editor/gltf/studio-gltf-extract";

const sample: StudioGltfExtractionResult = {
  animations: [{ kind: "animation", ref: "Take 001", label: "Take 001" }],
  parts: [{ kind: "part", ref: "Arm", label: "Arm" }],
  materials: [],
  morphs: [],
  lights: [],
  cameras: [],
  sceneTree: [],
  objectDetailsByPath: {},
  materialDetailsByName: {},
};

test("filterExtractionByType keeps only the selected kind", () => {
  const filtered = filterExtractionByType(sample, "animation");
  assert.equal(filtered.animations.length, 1);
  assert.equal(filtered.parts.length, 0);
});

test("countModelOutlinerTypeFilter counts per chip", () => {
  assert.equal(countModelOutlinerTypeFilter(sample, "all"), 2);
  assert.equal(countModelOutlinerTypeFilter(sample, "part"), 1);
  assert.equal(countModelOutlinerTypeFilter(sample, "material"), 0);
});

test("typeFilterUsesFlatExtractList covers non-scene GLB metadata", () => {
  assert.equal(typeFilterUsesFlatExtractList("animation"), true);
  assert.equal(typeFilterUsesFlatExtractList("material"), true);
  assert.equal(typeFilterUsesFlatExtractList("part"), false);
});

test("isSceneHierarchyTypeFilter covers scene graph kinds", () => {
  assert.equal(isSceneHierarchyTypeFilter("part"), true);
  assert.equal(isSceneHierarchyTypeFilter("animation"), false);
  assert.equal(isSceneHierarchyTypeFilter("all"), true);
});
