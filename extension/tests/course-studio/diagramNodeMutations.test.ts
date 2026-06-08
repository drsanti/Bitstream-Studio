import assert from "node:assert/strict";
import test from "node:test";

import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import {
  findDiagramNode,
  getNodeHitBounds,
  patchDiagramNode,
  reorderDiagramNode,
} from "../../src/webview/course-studio/runtime/diagram/diagramNodeMutations";
import pilotMemsDiagramJson from "../../src/webview/course-studio/content/pilot-bmi-accel-mems.diagram.v1.json";

test("patchDiagramNode moves static rect position", () => {
  const diagram = parseDiagramV1(pilotMemsDiagramJson);
  const next = patchDiagramNode(diagram, "frame", { x: 30, y: 24 });
  const frame = next.nodes.find((node) => node.id === "frame");
  assert.ok(frame != null && frame.type === "rect");
  assert.equal(frame.x, 30);
  assert.equal(frame.y, 24);
});

test("getNodeHitBounds uses base for bound rect axis", () => {
  const diagram = parseDiagramV1(pilotMemsDiagramJson);
  const mass = findDiagramNode(diagram, "proof-mass");
  assert.ok(mass != null && mass.type === "rect");
  const bounds = getNodeHitBounds(mass);
  assert.ok(bounds != null);
  assert.equal(bounds.x, 118);
  assert.equal(bounds.y, 78);
});

test("patchDiagramNode does not overwrite bound proof-mass Y", () => {
  const diagram = parseDiagramV1(pilotMemsDiagramJson);
  const next = patchDiagramNode(diagram, "proof-mass", { x: 120 });
  const mass = findDiagramNode(next, "proof-mass");
  assert.ok(mass != null && mass.type === "rect");
  assert.equal(mass.x, 120);
  assert.equal(typeof mass.y, "object");
});

test("reorderDiagramNode moves top-level nodes forward and backward", () => {
  const diagram = parseDiagramV1(pilotMemsDiagramJson);
  const ids = diagram.nodes.map((node) => node.id);
  const proofIndex = ids.indexOf("proof-mass");
  assert.ok(proofIndex >= 0);

  const toFront = reorderDiagramNode(diagram, "proof-mass", "front");
  assert.equal(toFront.nodes[toFront.nodes.length - 1]?.id, "proof-mass");

  const toBack = reorderDiagramNode(toFront, "proof-mass", "back");
  assert.equal(toBack.nodes[0]?.id, "proof-mass");

  const oneForward = reorderDiagramNode(toBack, "proof-mass", "forward");
  assert.equal(oneForward.nodes[1]?.id, "proof-mass");
});
