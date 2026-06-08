import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCanvasModelOutlinerNavigate,
  buildCatalogOutlinerNavigate,
  findExtractRowInExtraction,
} from "../../src/webview/sensor-studio/features/editor/model-outliner/model-outliner-navigation";
import type { StudioGltfExtractionResult } from "../../src/webview/sensor-studio/features/editor/gltf/studio-gltf-extract";

const extraction: StudioGltfExtractionResult = {
  animations: [{ kind: "animation", ref: "Idle", label: "Idle" }],
  parts: [{ kind: "part", ref: "Arm", label: "Arm" }],
  materials: [],
  morphs: [],
  lights: [],
  cameras: [],
  sceneTree: [],
  objectDetailsByPath: {},
  materialDetailsByName: {},
};

test("buildCanvasModelOutlinerNavigate scopes to canvas model", () => {
  const payload = buildCanvasModelOutlinerNavigate("ms-1", "animation");
  assert.equal(payload.scopeMode, "canvas-model-select");
  assert.equal(payload.canvasModelId, "ms-1");
  assert.equal(payload.typeFilter, "animation");
});

test("buildCatalogOutlinerNavigate scopes to catalog asset", () => {
  const payload = buildCatalogOutlinerNavigate("drone-glb", "part");
  assert.equal(payload.scopeMode, "catalog-inline");
  assert.equal(payload.catalogAssetId, "drone-glb");
  assert.equal(payload.typeFilter, "part");
});

test("findExtractRowInExtraction finds rows across kinds", () => {
  assert.equal(findExtractRowInExtraction(extraction, { kind: "animation", ref: "Idle" })?.label, "Idle");
  assert.equal(findExtractRowInExtraction(extraction, { kind: "part", ref: "Arm" })?.label, "Arm");
  assert.equal(findExtractRowInExtraction(extraction, { kind: "material", ref: "x" }), null);
});
