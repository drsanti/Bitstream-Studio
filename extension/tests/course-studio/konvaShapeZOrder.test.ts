import assert from "node:assert/strict";
import test from "node:test";

import { reorderKonvaShapes } from "../../src/webview/course-studio/runtime/diagram/konvaShapeZOrder";

const shapes = [
  { id: "a", type: "rect" as const, x: 0, y: 0, width: 10, height: 10 },
  { id: "b", type: "rect" as const, x: 20, y: 0, width: 10, height: 10 },
  { id: "c", type: "rect" as const, x: 40, y: 0, width: 10, height: 10 },
];

test("reorderKonvaShapes brings shape to front", () => {
  const next = reorderKonvaShapes(shapes, "a", "front");
  assert.deepEqual(
    next.map((shape) => shape.id),
    ["b", "c", "a"],
  );
});

test("reorderKonvaShapes sends shape backward", () => {
  const next = reorderKonvaShapes(shapes, "c", "backward");
  assert.deepEqual(
    next.map((shape) => shape.id),
    ["a", "c", "b"],
  );
});
