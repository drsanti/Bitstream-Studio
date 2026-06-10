import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createBlankDiagramV1,
  createLiveCanvasDemoDiagramV1,
} from "../../src/webview/course-studio/content/diagramTemplates";
import type { DiagramLiveSnapshot } from "../../src/webview/course-studio/runtime/diagram/diagramBindingCatalog";
import { evaluateKonvaShapes } from "../../src/webview/course-studio/runtime/diagram/evaluateKonvaShapes";
import { COURSE_KONVA_CANVAS_BG } from "../../src/webview/course-studio/maintainer/courseKonvaTheme";
import {
  diagramHasKonvaFreeform,
  konvaFreeformHasContent,
} from "../../src/webview/course-studio/schemas/diagramFreeform";
import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import { diagramLiveSnapshot } from "./diagramLiveSnapshotFixtures";

test("createBlankDiagramV1 uses Konva freeform document", () => {
  const diagram = createBlankDiagramV1("test-diagram");
  assert.equal(diagram.id, "test-diagram");
  assert.equal(diagramHasKonvaFreeform(diagram), true);
  assert.equal(konvaFreeformHasContent(diagram), false);
  assert.equal(diagram.nodes.length, 0);
  assert.equal(diagram.freeform?.view?.background, COURSE_KONVA_CANVAS_BG);
  assert.equal(diagram.freeform?.engine, "konva");
});

test("createLiveCanvasDemoDiagramV1 ships konva bindings for bmi270.ax", () => {
  const diagram = createLiveCanvasDemoDiagramV1("live-demo");
  assert.equal(diagram.freeform?.propertyBindings?.["proof-indicator"]?.y != null, true);
  const resolved = evaluateKonvaShapes(diagram.freeform!, diagramLiveSnapshot({
    connected: true,
    bmi270: { ax: 0.5, hasSample: true } as DiagramLiveSnapshot["bmi270"],
  }));
  const indicator = resolved.find((entry) => entry.id === "proof-indicator");
  assert.equal(indicator?.y, 210);
  const arrow = resolved.find((entry) => entry.id === "accel-arrow");
  assert.equal(arrow?.type, "arrow");
  if (arrow?.type === "arrow") {
    assert.equal(arrow.x2, 530);
  }
});

test("parseDiagramV1 migrates legacy excalidraw freeform to konva", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "freeform-only",
    viewBox: [0, 0, 640, 480],
    freeform: {
      engine: "excalidraw",
      elements: [
        {
          id: "rect-1",
          type: "rectangle",
          x: 10,
          y: 20,
          width: 100,
          height: 50,
        },
      ],
    },
  });
  assert.equal(diagram.freeform?.engine, "konva");
  assert.equal(diagram.freeform?.shapes.length, 1);
  assert.equal(diagram.freeform?.shapes[0]?.type, "rect");
  assert.equal(diagram.nodes.length, 0);
});

test("parseDiagramV1 accepts konva-only diagram", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "konva-only",
    viewBox: [0, 0, 640, 480],
    freeform: {
      engine: "konva",
      shapes: [{ id: "t1", type: "text", x: 0, y: 0, text: "hi" }],
    },
  });
  assert.equal(diagram.freeform?.shapes.length, 1);
});
