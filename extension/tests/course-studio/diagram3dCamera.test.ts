import assert from "node:assert/strict";
import test from "node:test";

import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import {
  DEFAULT_DIAGRAM_3D_CAMERA,
  readDiagram3dCamera,
} from "../../src/webview/course-studio/runtime/diagram/diagram3dCamera";
import {
  addDiagram3dNode,
  createDefaultDiagram3dModelNode,
  patchDiagram3dCamera,
} from "../../src/webview/course-studio/runtime/diagram/diagram3dNodeMutations";
import pilotMemsDiagramJson from "../../src/webview/course-studio/content/pilot-bmi-accel-mems.diagram.v1.json";

test("readDiagram3dCamera falls back to bundled default", () => {
  const diagram = addDiagram3dNode(
    parseDiagramV1(pilotMemsDiagramJson),
    createDefaultDiagram3dModelNode("pcb-live"),
  );
  const camera = readDiagram3dCamera(diagram);
  assert.deepEqual(camera.position, DEFAULT_DIAGRAM_3D_CAMERA.position);
  assert.equal(camera.fov, DEFAULT_DIAGRAM_3D_CAMERA.fov);
});

test("readDiagram3dCamera reads patched layer camera", () => {
  const base = addDiagram3dNode(
    parseDiagramV1(pilotMemsDiagramJson),
    createDefaultDiagram3dModelNode("pcb-live"),
  );
  const patched = patchDiagram3dCamera(base, { positionY: 6, fov: 50 });
  const camera = readDiagram3dCamera(patched);
  assert.equal(camera.position[1], 6);
  assert.equal(camera.fov, 50);
});
