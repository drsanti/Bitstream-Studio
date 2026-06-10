import assert from "node:assert/strict";
import test from "node:test";

import {
  duplicateDiagram3dNode,
  patchDiagram3dNode,
  createDefaultDiagram3dModelNode,
} from "../../src/webview/course-studio/runtime/diagram/diagram3dNodeMutations";
import {
  mergeDiagram3dMaterial,
  mergeDiagram3dMaterialPatch,
  DEFAULT_DIAGRAM_3D_MESH_MATERIAL,
} from "../../src/webview/course-studio/runtime/diagram/diagram3dMaterial";
import {
  DIAGRAM_3D_MATERIAL_PRESETS,
  findDiagram3dMaterialPreset,
} from "../../src/webview/course-studio/runtime/diagram/diagram3dMaterialPresets";
import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import { getDiagram3dLayer } from "../../src/webview/course-studio/schemas/normalizeDiagramV1";
test("mergeDiagram3dMaterialPatch merges and clears material overrides", () => {
  const merged = mergeDiagram3dMaterialPatch(undefined, { color: "#ff0000", metalness: 0.8 });
  assert.deepEqual(merged, { color: "#ff0000", metalness: 0.8 });
  assert.equal(mergeDiagram3dMaterialPatch(merged, null), undefined);
});

test("mergeDiagram3dMaterial applies overrides on defaults", () => {
  const resolved = mergeDiagram3dMaterial(DEFAULT_DIAGRAM_3D_MESH_MATERIAL, {
    color: "#112233",
    roughness: 0.2,
  });
  assert.equal(resolved.color, "#112233");
  assert.equal(resolved.roughness, 0.2);
  assert.equal(resolved.metalness, DEFAULT_DIAGRAM_3D_MESH_MATERIAL.metalness);
});

test("mergeDiagram3dMaterial applies physical overrides on defaults", () => {
  const resolved = mergeDiagram3dMaterial(DEFAULT_DIAGRAM_3D_MESH_MATERIAL, {
    kind: "physical",
    clearcoat: 1,
    transmission: 0.8,
    ior: 1.45,
  });
  assert.equal(resolved.kind, "physical");
  assert.equal(resolved.clearcoat, 1);
  assert.equal(resolved.transmission, 0.8);
  assert.equal(resolved.ior, 1.45);
});

test("material presets expose at least ten entries with editable fields", () => {
  assert.ok(DIAGRAM_3D_MATERIAL_PRESETS.length >= 10);
  const glass = findDiagram3dMaterialPreset("clear-glass");
  assert.ok(glass != null);
  assert.equal(glass.material.kind, "physical");
  assert.equal(glass.material.transmission, 0.92);
});

test("parseDiagramV1 accepts extended material and procedural model ids", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "diagram-test",
    viewBox: [0, 0, 360, 360],
    nodes: [],
    layers: [
      {
        kind: "3d",
        nodes: [
          {
            id: "ring-1",
            type: "model",
            modelId: "procedural-ring",
            material: {
              presetId: "car-paint-red",
              kind: "physical",
              clearcoat: 1,
              wireframe: false,
            },
          },
        ],
      },
    ],
  });
  const node = getDiagram3dLayer(diagram)?.nodes[0];
  assert.ok(node != null && node.type === "model");
  assert.equal(node.modelId, "procedural-ring");
  assert.equal(node.material?.presetId, "car-paint-red");
});

test("patchDiagram3dNode stores material on model nodes", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "diagram-test",
    viewBox: [0, 0, 360, 360],
    nodes: [],
    layers: [
      {
        kind: "3d",
        nodes: [createDefaultDiagram3dModelNode("pcb")],
      },
    ],
  });
  const next = patchDiagram3dNode(diagram, "pcb", {
    material: { color: "#aabbcc", metalness: 0.9 },
  });
  const node = getDiagram3dLayer(next)?.nodes[0];
  assert.ok(node != null && node.type === "model");
  assert.equal(node.material?.color, "#aabbcc");
  assert.equal(node.material?.metalness, 0.9);
});

test("duplicateDiagram3dNode clones node with new id", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "diagram-test",
    viewBox: [0, 0, 360, 360],
    nodes: [],
    layers: [
      {
        kind: "3d",
        nodes: [createDefaultDiagram3dModelNode("pcb")],
      },
    ],
  });
  const next = duplicateDiagram3dNode(diagram, "pcb", "pcb-copy");
  const nodes = getDiagram3dLayer(next)?.nodes ?? [];
  assert.equal(nodes.length, 2);
  assert.ok(nodes.some((entry) => entry.id === "pcb-copy"));
});
