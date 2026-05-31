import assert from "node:assert/strict";
import test from "node:test";

import {
  clampGlbMaterialParamValue,
  mergeGlbMaterialPbrDriveRow,
  readGlbMaterialParam,
  STUDIO_GLB_MATERIAL_PARAM_KEY,
} from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-material-param";
import { collectGlbScalarDrivesForModel } from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-flow-drives";
import {
  STUDIO_GLB_EXTRACT_KIND_KEY,
  STUDIO_GLB_EXTRACT_REF_KEY,
  STUDIO_SOURCE_MODEL_NODE_ID_KEY,
} from "../../src/webview/sensor-studio/features/editor/model/model-generated-bindings";

test("readGlbMaterialParam defaults to emissive for legacy rows", () => {
  assert.equal(readGlbMaterialParam({}), "emissive");
  assert.equal(readGlbMaterialParam({ [STUDIO_GLB_MATERIAL_PARAM_KEY]: "roughness" }), "roughness");
});

test("clampGlbMaterialParamValue clamps PBR channels", () => {
  assert.equal(clampGlbMaterialParamValue("emissive", -2), 0);
  assert.equal(clampGlbMaterialParamValue("roughness", 1.5), 1);
  assert.equal(clampGlbMaterialParamValue("opacity", 0.25), 0.25);
});

test("collectGlbScalarDrivesForModel merges material PBR params per material name", () => {
  const modelId = "model-1";
  const nodes = [
    {
      id: modelId,
      data: { nodeId: "model-select", defaultConfig: {} },
    },
    {
      id: "n-emissive",
      data: {
        nodeId: "glb-material-param",
        defaultConfig: {
          [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelId,
          [STUDIO_GLB_EXTRACT_KIND_KEY]: "material",
          [STUDIO_GLB_EXTRACT_REF_KEY]: "BodyMat",
          [STUDIO_GLB_MATERIAL_PARAM_KEY]: "emissive",
          value: 2,
        },
        liveValue: 2,
      },
    },
    {
      id: "n-rough",
      data: {
        nodeId: "glb-material-param",
        defaultConfig: {
          [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelId,
          [STUDIO_GLB_EXTRACT_KIND_KEY]: "material",
          [STUDIO_GLB_EXTRACT_REF_KEY]: "BodyMat",
          [STUDIO_GLB_MATERIAL_PARAM_KEY]: "roughness",
          value: 0.2,
        },
        liveValue: 0.2,
      },
    },
  ] as const;

  const drives = collectGlbScalarDrivesForModel(nodes, modelId);
  assert.deepEqual(drives.materialPbr.BodyMat, {
    emissive: 2,
    roughness: 0.2,
  });
  assert.deepEqual(
    mergeGlbMaterialPbrDriveRow(undefined, "metalness", 0.75),
    { metalness: 0.75 },
  );
});
