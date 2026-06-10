import assert from "node:assert/strict";
import test from "node:test";

import { collectDiagramBindingPaths } from "../../src/webview/course-studio/runtime/diagram/collectDiagramBindings";
import {
  evaluateDiagram3dProps,
  findResolved3dNode,
} from "../../src/webview/course-studio/runtime/diagram/evaluateDiagram3dProps";
import type { DiagramLiveSnapshot } from "../../src/webview/course-studio/runtime/diagram/diagramBindingCatalog";
import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import {
  diagramHas3dLayer,
  getDiagram3dLayer,
  getDiagram3dNodes,
  normalizeDiagramLayers,
} from "../../src/webview/course-studio/schemas/normalizeDiagramV1";
import { presentationBmi270FromSample } from "../../src/webview/presentation/display/selectors";
import { diagramLiveSnapshot } from "./diagramLiveSnapshotFixtures";
import pilotMemsDiagramJson from "../../src/webview/course-studio/content/pilot-bmi-accel-mems.diagram.v1.json";
import pilotOrientation3dDiagramJson from "../../src/webview/course-studio/content/pilot-bmi-orientation-3d.diagram.v1.json";

const layeredDiagramJson = {
  version: 1,
  id: "pilot-bmi-orientation-3d",
  title: "PCB orientation (layered)",
  viewBox: [0, 0, 360, 220],
  layers: [
    {
      kind: "2d",
      nodes: [
        {
          id: "caption",
          type: "text",
          x: 180,
          y: 16,
          content: "Live PCB orientation",
          fontSize: 11,
          fill: "muted",
          textAnchor: "middle",
        },
      ],
    },
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
              qx: { path: "bmi270.qx", fallback: 0 },
              qy: { path: "bmi270.qy", fallback: 0 },
              qz: { path: "bmi270.qz", fallback: 0 },
            },
          },
        },
      ],
      camera: { position: [3, 2.5, 4], fov: 45 },
    },
  ],
} as const;

function snapshotWithQuat(
  qw: number,
  qx: number,
  qy: number,
  qz: number,
): DiagramLiveSnapshot {
  return diagramLiveSnapshot({
    connected: true,
    bmi270: {
      ...presentationBmi270FromSample(null),
      qw,
      qx,
      qy,
      qz,
      quatValid: true,
      hasSample: true,
    },
  });
}

test("parseDiagramV1 normalizes legacy nodes-only JSON into layers", () => {
  const diagram = parseDiagramV1(pilotMemsDiagramJson);
  assert.equal(diagram.layers.length, 1);
  assert.equal(diagram.layers[0]?.kind, "2d");
  assert.equal(diagram.nodes.length, diagram.layers[0]?.kind === "2d" ? diagram.layers[0].nodes.length : 0);
  assert.ok(diagram.nodes.some((node) => node.id === "proof-mass"));
  assert.equal(diagramHas3dLayer(diagram), false);
});

test("parseDiagramV1 accepts layered diagram with 2d and 3d", () => {
  const diagram = parseDiagramV1(layeredDiagramJson);
  assert.equal(diagram.layers.length, 2);
  assert.equal(diagram.layers[0]?.kind, "2d");
  assert.equal(diagram.layers[1]?.kind, "3d");
  assert.equal(diagram.nodes.length, 1);
  assert.equal(diagram.nodes[0]?.id, "caption");
  assert.equal(diagramHas3dLayer(diagram), true);
  assert.equal(getDiagram3dLayer(diagram)?.camera?.fov, 45);
});

test("normalizeDiagramLayers prefers explicit layers over legacy nodes", () => {
  const normalized = normalizeDiagramLayers({
    version: 1,
    id: "x",
    viewBox: [0, 0, 100, 100],
    nodes: [{ id: "legacy", type: "text", x: 0, y: 0, content: "legacy" }],
    layers: [{ kind: "2d", nodes: [{ id: "layer", type: "text", x: 1, y: 1, content: "layer" }] }],
  });
  assert.equal(normalized.nodes[0]?.id, "layer");
});

test("evaluateDiagram3dProps resolves quaternion bindings on model nodes", () => {
  const diagram = parseDiagramV1(layeredDiagramJson);
  const identity = evaluateDiagram3dProps(
    diagram,
    snapshotWithQuat(1, 0, 0, 0),
  );
  const pcbIdentity = findResolved3dNode(identity, "pcb");
  assert.ok(pcbIdentity != null && pcbIdentity.type === "model");
  assert.equal(pcbIdentity.modelId, "procedural-pcb");
  assert.deepEqual(pcbIdentity.position, [0, 0, 0]);
  assert.deepEqual(pcbIdentity.scale, [1, 1, 1]);
  assert.equal(pcbIdentity.rotation.kind, "quaternion");
  if (pcbIdentity.rotation.kind === "quaternion") {
    assert.equal(pcbIdentity.rotation.qw, 1);
    assert.equal(pcbIdentity.rotation.qx, 0);
  }

  const tilted = evaluateDiagram3dProps(
    diagram,
    snapshotWithQuat(0.9239, 0.3827, 0, 0),
  );
  const pcbTilt = findResolved3dNode(tilted, "pcb");
  assert.ok(pcbTilt != null && pcbTilt.type === "model");
  assert.equal(pcbTilt.rotation.kind, "quaternion");
  if (pcbTilt.rotation.kind === "quaternion") {
    assert.ok(Math.abs(pcbTilt.rotation.qw - 0.9239) < 0.001);
    assert.ok(Math.abs(pcbTilt.rotation.qx - 0.3827) < 0.001);
  }
});

test("evaluateDiagram3dProps resolves static euler rotation tuple", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "euler-static",
    viewBox: [0, 0, 100, 100],
    layers: [
      {
        kind: "3d",
        nodes: [
          {
            id: "box",
            type: "model",
            modelId: "procedural-box",
            rotation: [10, 20, 30],
          },
        ],
      },
    ],
  });
  const resolved = evaluateDiagram3dProps(diagram, snapshotWithQuat(1, 0, 0, 0));
  const box = findResolved3dNode(resolved, "box");
  assert.ok(box != null && box.type === "model");
  assert.equal(box.rotation.kind, "euler");
  if (box.rotation.kind === "euler") {
    assert.deepEqual([box.rotation.pitch, box.rotation.yaw, box.rotation.roll], [10, 20, 30]);
  }
});

test("collectDiagramBindingPaths includes 3d quaternion paths", () => {
  const diagram = parseDiagramV1(layeredDiagramJson);
  const paths = collectDiagramBindingPaths(diagram);
  assert.ok(paths.includes("bmi270.qw"));
  assert.ok(paths.includes("bmi270.qx"));
  assert.ok(paths.includes("bmi270.qy"));
  assert.ok(paths.includes("bmi270.qz"));
});

test("bundled pilot-bmi-orientation-3d diagram has 2d and 3d layers", () => {
  const diagram = parseDiagramV1(pilotOrientation3dDiagramJson);
  assert.equal(diagram.id, "pilot-bmi-orientation-3d");
  assert.equal(diagramHas3dLayer(diagram), true);
  assert.equal(getDiagram3dNodes(diagram).length, 1);
});
