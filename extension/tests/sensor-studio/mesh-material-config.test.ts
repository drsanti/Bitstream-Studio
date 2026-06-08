import assert from "node:assert/strict";
import test from "node:test";

import {
  flowWireMaterialFromMeshMaterialEval,
  resolveMaterialWireSocketLabel,
} from "../../src/webview/sensor-studio/features/editor/nodes/material/mesh-material-config";
import { coerceFlowWireMaterialV1 } from "../../src/webview/sensor-studio/features/editor/nodes/material/flow-wire-material";

test("flowWireMaterialFromMeshMaterialEval builds basic material wire from defaults", () => {
  const wire = flowWireMaterialFromMeshMaterialEval({
    kind: "basic",
    defaultConfig: {
      meshMaterialColorHex: "#ff0000",
      meshMaterialOpacity: 0.8,
      meshMaterialWireframe: true,
    },
  });
  assert.deepEqual(wire, {
    version: 1,
    kind: "basic",
    colorHex: "#ff0000",
    opacity: 0.8,
    wireframe: true,
  });
});

test("flowWireMaterialFromMeshMaterialEval builds standard material with wired overrides", () => {
  const wire = flowWireMaterialFromMeshMaterialEval({
    kind: "standard",
    defaultConfig: {
      meshMaterialColorHex: "#ffffff",
      meshMaterialRoughness: 0.5,
      meshMaterialMetalness: 0,
    },
    wired: {
      color: { x: 0, y: 0.5, z: 1 },
      roughness: 0.25,
      metalness: 0.75,
      opacity: 0.9,
    },
  });
  assert.equal(wire.kind, "standard");
  assert.equal(wire.roughness, 0.25);
  assert.equal(wire.metalness, 0.75);
  assert.equal(wire.opacity, 0.9);
  assert.equal(wire.colorHex, "#0080ff");
});

test("coerceFlowWireMaterialV1 rejects invalid version", () => {
  assert.equal(coerceFlowWireMaterialV1({ version: 2, kind: "basic" }), null);
});

test("coerceFlowWireMaterialV1 accepts standard wire", () => {
  const wire = coerceFlowWireMaterialV1({
    version: 1,
    kind: "standard",
    colorHex: "#aabbcc",
    opacity: 1,
    roughness: 0.4,
    metalness: 0.1,
  });
  assert.equal(wire?.kind, "standard");
  assert.equal(wire?.roughness, 0.4);
});

test("resolveMaterialWireSocketLabel formats standard badge", () => {
  const label = resolveMaterialWireSocketLabel({
    version: 1,
    kind: "standard",
    colorHex: "#336699",
    opacity: 1,
    roughness: 0.42,
    metalness: 0.08,
  });
  assert.equal(label, "Standard · #336699 · r42 m8");
});

test("resolveMaterialWireSocketLabel formats basic wireframe badge", () => {
  const label = resolveMaterialWireSocketLabel({
    version: 1,
    kind: "basic",
    colorHex: "#112233",
    opacity: 1,
    wireframe: true,
  });
  assert.equal(label, "Basic · #112233 · wire");
});

test("flowWireMaterialFromMeshMaterialEval builds physical material", () => {
  const wire = flowWireMaterialFromMeshMaterialEval({
    kind: "physical",
    defaultConfig: {
      meshMaterialColorHex: "#ffffff",
      meshMaterialRoughness: 0.4,
      meshMaterialMetalness: 0.2,
      meshMaterialClearcoat: 1,
      meshMaterialTransmission: 0.5,
    },
  });
  assert.equal(wire.kind, "physical");
  assert.equal(wire.clearcoat, 1);
  assert.equal(wire.transmission, 0.5);
});

test("coerceFlowWireMaterialV1 accepts toon wire", () => {
  const wire = coerceFlowWireMaterialV1({
    version: 1,
    kind: "toon",
    colorHex: "#ff00ff",
    opacity: 1,
    wireframe: false,
  });
  assert.equal(wire?.kind, "toon");
});
