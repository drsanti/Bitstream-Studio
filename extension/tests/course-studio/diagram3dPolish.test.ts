import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateDiagram3dProps,
  findResolved3dModelNode,
} from "../../src/webview/course-studio/runtime/diagram/evaluateDiagram3dProps";
import {
  isCatalogDiagram3dModelId,
  toCatalogDiagram3dModelId,
} from "../../src/webview/course-studio/runtime/diagram/diagram3dModelId";
import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import type { DiagramLiveSnapshot } from "../../src/webview/course-studio/runtime/diagram/diagramBindingCatalog";
import { presentationBmi270FromSample } from "../../src/webview/presentation/display/selectors";
import { applyMapOps } from "../../src/webview/course-studio/runtime/diagram/evaluateDiagramScene";
import { diagramLiveSnapshot } from "./diagramLiveSnapshotFixtures";

const snapshot = diagramLiveSnapshot({
  connected: true,
  bmi270: { ...presentationBmi270FromSample(null), pitch: 45, hasSample: true },
});

test("catalog model id helpers", () => {
  const id = toCatalogDiagram3dModelId("mirror:demo/part.glb");
  assert.ok(isCatalogDiagram3dModelId(id));
  assert.equal(id, "catalog:mirror:demo/part.glb");
});

test("parseDiagramV1 accepts catalog model id", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "catalog-model",
    viewBox: [0, 0, 100, 100],
    layers: [
      {
        kind: "3d",
        nodes: [
          {
            id: "part",
            type: "model",
            modelId: "catalog:mirror:demo/part.glb",
          },
        ],
      },
    ],
  });
  const layer = diagram.layers?.find((entry) => entry.kind === "3d");
  const model = layer?.nodes[0];
  assert.equal(model?.type, "model");
  if (model?.type === "model") {
    assert.equal(model.modelId, "catalog:mirror:demo/part.glb");
  }
});

test("evaluateDiagram3dProps resolves nested group3d transforms", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "grouped",
    viewBox: [0, 0, 100, 100],
    layers: [
      {
        kind: "3d",
        nodes: [
          {
            id: "assembly",
            type: "group3d",
            position: { x: 1, y: 0, z: -0.5 },
            children: [
              {
                id: "child-box",
                type: "model",
                modelId: "procedural-box",
                position: { x: 0.2, y: 0, z: 0 },
              },
            ],
          },
        ],
      },
    ],
  });

  const resolved = evaluateDiagram3dProps(diagram, snapshot);
  assert.equal(resolved.roots.length, 1);
  assert.equal(resolved.roots[0]?.type, "group3d");
  if (resolved.roots[0]?.type === "group3d") {
    assert.deepEqual(resolved.roots[0].position, [1, 0, -0.5]);
    assert.equal(resolved.roots[0].children.length, 1);
  }

  const child = findResolved3dModelNode(resolved, "child-box");
  assert.ok(child != null);
  assert.deepEqual(child.position, [0.2, 0, 0]);
});

test("quaternion MapOp chain affects resolved rotation", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "mapop-quat",
    viewBox: [0, 0, 100, 100],
    layers: [
      {
        kind: "3d",
        nodes: [
          {
            id: "pcb",
            type: "model",
            modelId: "procedural-pcb",
            rotation: {
              kind: "quaternion",
              bindings: {
                qw: { path: "bmi270.qw", fallback: 1 },
                qx: {
                  path: "bmi270.pitch",
                  fallback: 0,
                  map: [{ op: "scale", inMin: 0, inMax: 90, outMin: 0, outMax: 1 }],
                },
                qy: { path: "bmi270.qy", fallback: 0 },
                qz: { path: "bmi270.qz", fallback: 0 },
              },
            },
          },
        ],
      },
    ],
  });

  const resolved = findResolved3dModelNode(evaluateDiagram3dProps(diagram, snapshot), "pcb");
  assert.ok(resolved != null);
  assert.equal(resolved.rotation.kind, "quaternion");
  if (resolved.rotation.kind === "quaternion") {
    const expectedQx = applyMapOps(45, [
      { op: "scale", inMin: 0, inMax: 90, outMin: 0, outMax: 1 },
    ]);
    assert.ok(Math.abs(resolved.rotation.qx - expectedQx) < 0.001);
  }
});
