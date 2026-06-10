import assert from "node:assert/strict";
import test from "node:test";

import {
  addDiagram3dNode,
  createDefaultDiagram3dModelNode,
  defaultBmi270QuaternionRotation,
  patchDiagram3dCamera,
  patchDiagram3dNode,
  removeDiagram3dNode,
  resetDiagram3dCamera,
} from "../../src/webview/course-studio/runtime/diagram/diagram3dNodeMutations";
import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import { diagramHas3dLayer, getDiagram3dLayer } from "../../src/webview/course-studio/schemas/normalizeDiagramV1";
import pilotMemsDiagramJson from "../../src/webview/course-studio/content/pilot-bmi-accel-mems.diagram.v1.json";

test("addDiagram3dNode appends 3d layer and syncDiagramLayers", () => {
  const base = parseDiagramV1(pilotMemsDiagramJson);
  const model = createDefaultDiagram3dModelNode("pcb-live");
  const next = addDiagram3dNode(base, model);

  assert.equal(diagramHas3dLayer(next), true);
  assert.equal(getDiagram3dLayer(next)?.nodes.length, 1);
  assert.equal(getDiagram3dLayer(next)?.nodes[0]?.id, "pcb-live");
  assert.equal(next.layers.length, 2);
  assert.equal(next.layers[0]?.kind, "2d");
  assert.deepEqual(next.layers[0]?.kind === "2d" ? next.layers[0].nodes : [], next.nodes);
});

test("patchDiagram3dNode updates model scale and opacity", () => {
  const base = addDiagram3dNode(
    parseDiagramV1(pilotMemsDiagramJson),
    createDefaultDiagram3dModelNode("pcb-live"),
  );
  const next = patchDiagram3dNode(base, "pcb-live", {
    scaleX: 2,
    scaleY: 0.5,
    scaleZ: 1.25,
    opacity: 0.6,
    visible: false,
  });
  const node = getDiagram3dLayer(next)?.nodes[0];
  assert.ok(node != null && node.type === "model");
  assert.equal(node.scale?.x, 2);
  assert.equal(node.scale?.y, 0.5);
  assert.equal(node.scale?.z, 1.25);
  assert.equal(node.opacity, 0.6);
  assert.equal(node.visible, false);
});

test("patchDiagram3dNode updates model rotation and keeps layers synced", () => {
  const base = addDiagram3dNode(
    parseDiagramV1(pilotMemsDiagramJson),
    createDefaultDiagram3dModelNode("pcb-live"),
  );
  const next = patchDiagram3dNode(base, "pcb-live", {
    rotation: defaultBmi270QuaternionRotation(),
    modelId: "procedural-box",
  });
  const node = getDiagram3dLayer(next)?.nodes[0];
  assert.ok(node != null && node.type === "model");
  assert.equal(node.modelId, "procedural-box");
  assert.equal(node.rotation?.kind, "quaternion");
});

test("removeDiagram3dNode drops empty 3d layer", () => {
  const withModel = addDiagram3dNode(
    parseDiagramV1(pilotMemsDiagramJson),
    createDefaultDiagram3dModelNode("pcb-live"),
  );
  const next = removeDiagram3dNode(withModel, "pcb-live");
  assert.equal(diagramHas3dLayer(next), false);
  assert.equal(next.layers.length, 1);
});

test("patchDiagram3dCamera updates saved default camera", () => {
  const base = addDiagram3dNode(
    parseDiagramV1(pilotMemsDiagramJson),
    createDefaultDiagram3dModelNode("pcb-live"),
  );
  const patched = patchDiagram3dCamera(base, { positionX: 5, fov: 55 });
  const layer = getDiagram3dLayer(patched);
  assert.equal(layer?.camera?.position?.[0], 5);
  assert.equal(layer?.camera?.fov, 55);
});

test("resetDiagram3dCamera restores bundled default", () => {
  const base = patchDiagram3dCamera(
    addDiagram3dNode(
      parseDiagramV1(pilotMemsDiagramJson),
      createDefaultDiagram3dModelNode("pcb-live"),
    ),
    { positionX: 9, fov: 70 },
  );
  const reset = resetDiagram3dCamera(base);
  const layer = getDiagram3dLayer(reset);
  assert.deepEqual(layer?.camera?.position, [3, 2.5, 4]);
  assert.equal(layer?.camera?.fov, 45);
});
