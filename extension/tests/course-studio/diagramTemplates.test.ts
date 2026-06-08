import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCourseDiagramFromTemplate,
  courseDiagramSourcePathForId,
  createBlankDiagramV1,
  duplicateDiagramV1,
} from "../../src/webview/course-studio/content/diagramTemplates";
import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import pilotMemsDiagramJson from "../../src/webview/course-studio/content/pilot-bmi-accel-mems.diagram.v1.json";

test("createBlankDiagramV1 produces a valid single-node diagram", () => {
  const diagram = createBlankDiagramV1("test-blank");
  assert.equal(diagram.id, "test-blank");
  assert.equal(diagram.nodes.length, 1);
  assert.equal(diagram.nodes[0]?.type, "text");
});

test("duplicateDiagramV1 clones pilot with new id", () => {
  const source = parseDiagramV1(pilotMemsDiagramJson);
  const copy = duplicateDiagramV1(source, "mems-copy", "Copy title");
  assert.equal(copy.id, "mems-copy");
  assert.equal(copy.title, "Copy title");
  assert.ok(copy.nodes.some((n) => n.id === "proof-mass"));
  assert.notEqual(copy.id, source.id);
});

test("courseDiagramSourcePathForId maps id to content path", () => {
  assert.equal(
    courseDiagramSourcePathForId("my-diagram"),
    "src/webview/course-studio/content/my-diagram.diagram.v1.json",
  );
});

test("buildCourseDiagramFromTemplate blank vs from-pilot", () => {
  const blank = buildCourseDiagramFromTemplate("blank");
  assert.match(blank.diagramId, /^diagram-/);
  assert.equal(blank.diagram.nodes.length, 1);

  const pilot = buildCourseDiagramFromTemplate("from-pilot");
  assert.match(pilot.diagramId, /^diagram-/);
  assert.ok(pilot.diagram.nodes.length > 1);
  assert.notEqual(pilot.diagram.id, blank.diagram.id);
});
