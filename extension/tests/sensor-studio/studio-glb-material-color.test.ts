import assert from "node:assert/strict";
import test from "node:test";

import { validateStudioNodeConfig } from "../../src/webview/sensor-studio/core/validation/node-config.validation";
import { collectGlbMaterialColorDrivesForModel } from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-flow-drives";
import {
  hexToGlbMaterialColorRgb,
  glbMaterialColorRgbToHex,
  mergeGlbMaterialColorDriveRow,
  readGlbMaterialColorTarget,
  STUDIO_GLB_MATERIAL_COLOR_HEX_KEY,
  STUDIO_GLB_MATERIAL_COLOR_TARGET_KEY,
} from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-material-color";
import {
  STUDIO_GLB_EXTRACT_KIND_KEY,
  STUDIO_GLB_EXTRACT_REF_KEY,
  STUDIO_SOURCE_MODEL_NODE_ID_KEY,
} from "../../src/webview/sensor-studio/features/editor/model/model-generated-bindings";

test("hexToGlbMaterialColorRgb and glbMaterialColorRgbToHex round-trip", () => {
  const rgb = hexToGlbMaterialColorRgb("#ff8040");
  assert.deepEqual(rgb, { r: 1, g: 128 / 255, b: 64 / 255 });
  assert.equal(glbMaterialColorRgbToHex(rgb), "#ff8040");
});

test("readGlbMaterialColorTarget defaults to baseColor", () => {
  assert.equal(readGlbMaterialColorTarget({}), "baseColor");
  assert.equal(
    readGlbMaterialColorTarget({ [STUDIO_GLB_MATERIAL_COLOR_TARGET_KEY]: "emissiveColor" }),
    "emissiveColor",
  );
});

test("collectGlbMaterialColorDrivesForModel merges base and emissive per material", () => {
  const modelId = "model-1";
  const nodes = [
    {
      id: modelId,
      data: { nodeId: "model-select", defaultConfig: {} },
    },
    {
      id: "n-base",
      data: {
        nodeId: "glb-material-color",
        defaultConfig: {
          [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelId,
          [STUDIO_GLB_EXTRACT_KIND_KEY]: "material",
          [STUDIO_GLB_EXTRACT_REF_KEY]: "BodyMat",
          [STUDIO_GLB_MATERIAL_COLOR_TARGET_KEY]: "baseColor",
          [STUDIO_GLB_MATERIAL_COLOR_HEX_KEY]: "#ff0000",
        },
        liveVector3Wire: { x: 1, y: 0, z: 0 },
      },
    },
    {
      id: "n-emissive",
      data: {
        nodeId: "glb-material-color",
        defaultConfig: {
          [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelId,
          [STUDIO_GLB_EXTRACT_KIND_KEY]: "material",
          [STUDIO_GLB_EXTRACT_REF_KEY]: "BodyMat",
          [STUDIO_GLB_MATERIAL_COLOR_TARGET_KEY]: "emissiveColor",
          [STUDIO_GLB_MATERIAL_COLOR_HEX_KEY]: "#00ff00",
        },
        liveVector3Wire: { x: 0, y: 1, z: 0 },
      },
    },
  ] as const;

  const colors = collectGlbMaterialColorDrivesForModel(nodes, modelId);
  assert.deepEqual(colors.BodyMat, {
    baseColor: { r: 1, g: 0, b: 0 },
    emissiveColor: { r: 0, g: 1, b: 0 },
  });
  assert.deepEqual(
    mergeGlbMaterialColorDriveRow(undefined, "baseColor", { r: 0.5, g: 0.5, b: 0.5 }),
    { baseColor: { r: 0.5, g: 0.5, b: 0.5 } },
  );
});

test("validateStudioNodeConfig rejects invalid glb-material-color hex", () => {
  const errs = validateStudioNodeConfig("glb-material-color", { glbMaterialColorHex: "red" });
  assert.ok(errs.some((e) => e.includes("glbMaterialColorHex")));
});

test("validateStudioNodeConfig rejects material-mix factor out of range", () => {
  const errs = validateStudioNodeConfig("material-mix", { factor: 1.5 });
  assert.ok(errs.some((e) => e.includes("factor")));
});
