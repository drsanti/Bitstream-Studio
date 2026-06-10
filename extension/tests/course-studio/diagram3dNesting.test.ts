import assert from "node:assert/strict";
import test from "node:test";

import {
  addDiagram3dNodeToParent,
  createDefaultDiagram3dGroupNode,
  createDefaultDiagram3dModelNode,
  findDiagram3dNode,
  findDiagram3dNodeParentId,
  moveDiagram3dNodeToParent,
} from "../../src/webview/course-studio/runtime/diagram/diagram3dNodeMutations";
import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import { getDiagram3dLayer } from "../../src/webview/course-studio/schemas/normalizeDiagramV1";
import pilotMemsDiagramJson from "../../src/webview/course-studio/content/pilot-bmi-accel-mems.diagram.v1.json";

test("addDiagram3dNodeToParent nests model under group3d", () => {
  const base = parseDiagramV1(pilotMemsDiagramJson);
  const withGroup = addDiagram3dNodeToParent(
    base,
    createDefaultDiagram3dGroupNode("assembly"),
    null,
  );
  const model = createDefaultDiagram3dModelNode("pcb-nested");
  const nested = addDiagram3dNodeToParent(withGroup, model, "assembly");

  const group = findDiagram3dNode(nested, "assembly");
  assert.ok(group?.type === "group3d");
  assert.equal(group.children.length, 1);
  assert.equal(group.children[0]?.id, "pcb-nested");
  assert.equal(findDiagram3dNodeParentId(nested, "pcb-nested"), "assembly");
});

test("moveDiagram3dNodeToParent reparents model to scene root", () => {
  const base = parseDiagramV1(pilotMemsDiagramJson);
  const withGroup = addDiagram3dNodeToParent(
    base,
    createDefaultDiagram3dGroupNode("assembly"),
    null,
  );
  const nested = addDiagram3dNodeToParent(
    withGroup,
    createDefaultDiagram3dModelNode("pcb-nested"),
    "assembly",
  );
  const reparented = moveDiagram3dNodeToParent(nested, "pcb-nested", null);

  const layer = getDiagram3dLayer(reparented);
  assert.ok(layer != null);
  assert.equal(layer.nodes.length, 2);
  assert.equal(findDiagram3dNodeParentId(reparented, "pcb-nested"), null);
  assert.equal(findDiagram3dNode(reparented, "assembly")?.type, "group3d");
});

test("moveDiagram3dNodeToParent rejects nesting group into itself", () => {
  const base = parseDiagramV1(pilotMemsDiagramJson);
  const withGroup = addDiagram3dNodeToParent(
    base,
    createDefaultDiagram3dGroupNode("assembly"),
    null,
  );
  const invalid = moveDiagram3dNodeToParent(withGroup, "assembly", "assembly");
  assert.equal(invalid, withGroup);
});
