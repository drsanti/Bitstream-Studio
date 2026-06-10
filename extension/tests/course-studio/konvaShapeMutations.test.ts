import assert from "node:assert/strict";
import test from "node:test";

import { duplicateKonvaShape } from "../../src/webview/course-studio/runtime/diagram/konvaShapeMutations";
import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";

test("duplicateKonvaShape offsets rect and assigns new id", () => {
  const copy = duplicateKonvaShape({
    id: "rect-1",
    type: "rect",
    x: 100,
    y: 80,
    width: 40,
    height: 30,
  });
  assert.notEqual(copy.id, "rect-1");
  assert.equal(copy.type, "rect");
  if (copy.type !== "rect") {
    return;
  }
  assert.equal(copy.x, 116);
  assert.equal(copy.y, 96);
});

test("duplicateKonvaShape offsets line endpoints", () => {
  const copy = duplicateKonvaShape({
    id: "line-1",
    type: "line",
    x1: 10,
    y1: 20,
    x2: 100,
    y2: 120,
  });
  assert.equal(copy.type, "line");
  if (copy.type !== "line") {
    return;
  }
  assert.equal(copy.x1, 26);
  assert.equal(copy.y1, 36);
  assert.equal(copy.x2, 116);
  assert.equal(copy.y2, 136);
});

test("parseDiagramV1 accepts konva line and arrow shapes", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "connector-diagram",
    viewBox: [0, 0, 640, 480],
    freeform: {
      engine: "konva",
      shapes: [
        { id: "l1", type: "line", x1: 0, y1: 0, x2: 100, y2: 0 },
        { id: "a1", type: "arrow", x1: 0, y1: 50, x2: 80, y2: 50 },
      ],
    },
  });
  assert.equal(diagram.freeform?.shapes.length, 2);
  assert.equal(diagram.freeform?.shapes[1]?.type, "arrow");
});
