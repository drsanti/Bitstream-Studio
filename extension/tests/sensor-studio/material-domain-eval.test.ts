import assert from "node:assert/strict";
import test from "node:test";

import {
  compactMaterialGraphEvaluation,
  evaluateMaterialGraphForModel,
  graphNeedsMaterialDomainEval,
  MATERIAL_DOMAIN_NODE_IDS,
} from "../../src/webview/sensor-studio/core/flow/material-domain-eval";
import {
  STUDIO_GLB_EXTRACT_KIND_KEY,
  STUDIO_GLB_EXTRACT_REF_KEY,
  STUDIO_SOURCE_MODEL_NODE_ID_KEY,
} from "../../src/webview/sensor-studio/features/editor/model/model-generated-bindings";
import { STUDIO_GLB_MATERIAL_PARAM_KEY } from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-material-param";
import { STUDIO_GLB_MATERIAL_COLOR_HEX_KEY } from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-material-color";

test("MATERIAL_DOMAIN_NODE_IDS includes Phase 6 nodes", () => {
  assert.ok(MATERIAL_DOMAIN_NODE_IDS.has("glb-material-color"));
  assert.ok(MATERIAL_DOMAIN_NODE_IDS.has("material-mix"));
});

test("graphNeedsMaterialDomainEval is true when material nodes present", () => {
  assert.equal(
    graphNeedsMaterialDomainEval([{ data: { nodeId: "plotter" } }, { data: { nodeId: "material-mix" } }]),
    true,
  );
  assert.equal(graphNeedsMaterialDomainEval([{ data: { nodeId: "sine-wave" } }]), false);
});

test("evaluateMaterialGraphForModel collects PBR, texture, and color drives", () => {
  const modelId = "model-1";
  const nodes = [
    { id: modelId, data: { nodeId: "model-select", defaultConfig: {} } },
    {
      id: "pbr",
      data: {
        nodeId: "glb-material-param",
        defaultConfig: {
          [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelId,
          [STUDIO_GLB_EXTRACT_KIND_KEY]: "material",
          [STUDIO_GLB_EXTRACT_REF_KEY]: "MatA",
          [STUDIO_GLB_MATERIAL_PARAM_KEY]: "roughness",
          value: 0.3,
        },
        liveValue: 0.3,
      },
    },
    {
      id: "color",
      data: {
        nodeId: "glb-material-color",
        defaultConfig: {
          [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelId,
          [STUDIO_GLB_EXTRACT_KIND_KEY]: "material",
          [STUDIO_GLB_EXTRACT_REF_KEY]: "MatA",
          glbMaterialColorTarget: "baseColor",
          [STUDIO_GLB_MATERIAL_COLOR_HEX_KEY]: "#808080",
        },
        liveVector3Wire: { x: 0.5, y: 0.5, z: 0.5 },
      },
    },
  ] as const;

  const evalResult = evaluateMaterialGraphForModel(nodes, modelId);
  assert.equal(evalResult.materialPbr.MatA?.roughness, 0.3);
  assert.deepEqual(evalResult.materialColors.MatA?.baseColor, { r: 0.5, g: 0.5, b: 0.5 });

  const compact = compactMaterialGraphEvaluation(evalResult);
  assert.ok(compact.glbMaterialPbrByName?.MatA);
  assert.ok(compact.glbMaterialColorsByName?.MatA);
  assert.equal(compact.glbMaterialTexturesByName, undefined);
});
