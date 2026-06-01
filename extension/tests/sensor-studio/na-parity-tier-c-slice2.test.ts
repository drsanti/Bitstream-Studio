import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateCameraSwitchIndex,
  evaluateContactShadowsOutputs,
  evaluateEmitterOutputs,
  evaluateMaterialVariantName,
  evaluateMorphWeight,
  evaluatePostProcessingOutputs,
  evaluateSceneLightOutputs,
  evaluateUvTransformOutputs,
} from "../../src/webview/sensor-studio/core/flow/scene-fx-operations";
import { normalizeNodeAssetForStudio } from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/normalize-node-asset-for-studio";

test("evaluateMorphWeight clamps 0–1", () => {
  assert.equal(evaluateMorphWeight(1.5, 0), 1);
  assert.equal(evaluateMorphWeight(-0.2, 0), 0);
  assert.equal(evaluateMorphWeight(null, 0.4), 0.4);
});

test("evaluateSceneLightOutputs reads wired intensity", () => {
  const out = evaluateSceneLightOutputs(2, 1, null, 1, null, 1, null, 1, null, 0, null, 5, null, 0);
  assert.equal(out.intensity, 2);
  assert.equal(out.y, 5);
});

test("evaluateCameraSwitchIndex clamps slot", () => {
  assert.equal(evaluateCameraSwitchIndex(9, 0), 7);
  assert.equal(evaluateCameraSwitchIndex(-1, 0), 0);
});

test("evaluatePostProcessingOutputs uses defaults", () => {
  const out = evaluatePostProcessingOutputs(null, 2, null, 0.5);
  assert.equal(out.bloomIntensity, 2);
  assert.equal(out.bloomThreshold, 0.5);
});

test("evaluateContactShadowsOutputs reads config", () => {
  const out = evaluateContactShadowsOutputs({ opacity: 0.3, blur: 1, far: 5, scale: 8 });
  assert.equal(out.opacity, 0.3);
  assert.equal(out.scale, 8);
});

test("evaluateEmitterOutputs reads wired rate", () => {
  const out = evaluateEmitterOutputs(null, 0, 12, 0);
  assert.equal(out.rate, 12);
});

test("evaluateUvTransformOutputs reads all keys", () => {
  const out = evaluateUvTransformOutputs({ uvScaleU: 2 }, () => null);
  assert.equal(out.uvScaleU, 2);
  assert.equal(out.uvOffsetV, 0);
});

test("evaluateMaterialVariantName trims wired string", () => {
  assert.equal(evaluateMaterialVariantName("  Red  ", ""), "Red");
});

test("normalizeNodeAssetForStudio maps Tier C slice 2 NA types", () => {
  const asset = normalizeNodeAssetForStudio({
    marker: "trn-node-asset",
    version: 1,
    meta: {
      id: "g2",
      name: "TierC2",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    nodes: [{ id: "host", type: "nodeGroup", position: { x: 0, y: 0 }, data: { subgraphId: "sg1" } }],
    edges: [],
    subgraphs: {
      sg1: {
        nodes: [
          { id: "m1", type: "morph", position: { x: 0, y: 0 }, data: { label: "mesh:smile" } },
          { id: "l1", type: "light", position: { x: 40, y: 0 }, data: { type: "point" } },
          { id: "c1", type: "cameraSwitch", position: { x: 80, y: 0 }, data: {} },
          { id: "p1", type: "postProcessing", position: { x: 120, y: 0 }, data: {} },
          { id: "u1", type: "uvTransform", position: { x: 160, y: 0 }, data: {} },
          { id: "w1", type: "wsClient", position: { x: 200, y: 0 }, data: { channel: "telemetry" } },
        ],
        edges: [],
        interface: { inputs: [], outputs: [] },
      },
    },
  });
  const byId = Object.fromEntries(
    (asset?.subgraphs.sg1?.nodes ?? []).map((n) => [n.id, (n.data as { nodeId?: string }).nodeId]),
  );
  assert.equal(byId.m1, "morph-target");
  assert.equal(byId.l1, "scene-light");
  assert.equal(byId.c1, "camera-switch");
  assert.equal(byId.p1, "post-processing");
  assert.equal(byId.u1, "uv-transform");
  assert.equal(byId.w1, "sensor-input");
});
