import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeDiagram3dMaterialPatch,
} from "../../src/webview/course-studio/runtime/diagram/diagram3dMaterial";
import {
  diagram3dMaterialHasAnyTextureUrl,
  resolveDiagram3dMaterialTextureMaps,
  sanitizeDiagram3dTextureUrl,
} from "../../src/webview/course-studio/runtime/diagram/diagram3dTextureMaps";
import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import { getDiagram3dLayer } from "../../src/webview/course-studio/schemas/normalizeDiagramV1";

test("sanitizeDiagram3dTextureUrl accepts https and rejects invalid protocols", () => {
  assert.equal(
    sanitizeDiagram3dTextureUrl("  https://cdn.example.com/albedo.png  "),
    "https://cdn.example.com/albedo.png",
  );
  assert.equal(sanitizeDiagram3dTextureUrl("ftp://example.com/map.png"), undefined);
  assert.equal(sanitizeDiagram3dTextureUrl("not-a-url"), undefined);
  assert.equal(sanitizeDiagram3dTextureUrl(""), undefined);
});

test("resolveDiagram3dMaterialTextureMaps keeps only valid map URLs", () => {
  const maps = resolveDiagram3dMaterialTextureMaps({
    mapUrl: "https://example.com/base.jpg",
    normalMapUrl: "bad",
    roughnessMapUrl: "http://example.com/rough.png",
  });
  assert.equal(maps.map, "https://example.com/base.jpg");
  assert.equal(maps.normalMap, undefined);
  assert.equal(maps.roughnessMap, "http://example.com/rough.png");
  assert.equal(diagram3dMaterialHasAnyTextureUrl({ mapUrl: "https://a/b.png" }), true);
});

test("mergeDiagram3dMaterialPatch strips cleared texture URL fields", () => {
  const merged = mergeDiagram3dMaterialPatch(
    { mapUrl: "https://example.com/old.png", color: "#ffffff" },
    { mapUrl: "" },
  );
  assert.equal(merged?.mapUrl, undefined);
  assert.equal(merged?.color, "#ffffff");
});

test("parseDiagramV1 accepts material texture URL fields", () => {
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
            id: "box-1",
            type: "model",
            modelId: "procedural-box",
            material: {
              kind: "standard",
              mapUrl: "https://example.com/albedo.png",
              normalMapUrl: "https://example.com/normal.png",
              roughnessMapUrl: "https://example.com/rough.png",
            },
          },
        ],
      },
    ],
  });
  const node = getDiagram3dLayer(diagram)?.nodes[0];
  assert.ok(node != null && node.type === "model");
  assert.equal(node.material?.mapUrl, "https://example.com/albedo.png");
  assert.equal(node.material?.normalMapUrl, "https://example.com/normal.png");
});
