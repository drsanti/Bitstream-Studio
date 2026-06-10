import assert from "node:assert/strict";
import test from "node:test";

import {
  konvaBoundsIntersect,
  konvaSelectionBoxIsDrag,
  konvaShapeIdsInSelectionBox,
  mergeKonvaShapeSelection,
  normalizeKonvaSelectionBox,
  primaryKonvaShapeSelection,
  toggleKonvaShapeSelection,
} from "../../src/webview/course-studio/runtime/diagram/konvaBoxSelection";

test("normalizeKonvaSelectionBox normalizes negative drag directions", () => {
  assert.deepEqual(normalizeKonvaSelectionBox({ x: 100, y: 80 }, { x: 40, y: 20 }), {
    x: 40,
    y: 20,
    width: 60,
    height: 60,
  });
});

test("konvaShapeIdsInSelectionBox returns intersecting shape ids", () => {
  const hits = konvaShapeIdsInSelectionBox(
    [
      { id: "a", type: "rect", x: 10, y: 10, width: 40, height: 30 },
      { id: "b", type: "rect", x: 200, y: 200, width: 20, height: 20 },
    ],
    { x: 0, y: 0, width: 60, height: 60 },
  );
  assert.deepEqual(hits, ["a"]);
});

test("konvaBoundsIntersect detects partial overlap", () => {
  assert.equal(
    konvaBoundsIntersect(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 8, y: 8, width: 10, height: 10 },
    ),
    true,
  );
  assert.equal(
    konvaBoundsIntersect(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 20, y: 20, width: 10, height: 10 },
    ),
    false,
  );
});

test("mergeKonvaShapeSelection supports additive selection", () => {
  assert.deepEqual(mergeKonvaShapeSelection(["a"], ["b", "c"], true), ["a", "b", "c"]);
  assert.deepEqual(mergeKonvaShapeSelection(["a"], ["b"], false), ["b"]);
});

test("toggleKonvaShapeSelection adds and removes ids", () => {
  assert.deepEqual(toggleKonvaShapeSelection(["a"], "b"), ["a", "b"]);
  assert.deepEqual(toggleKonvaShapeSelection(["a", "b"], "a"), ["b"]);
});

test("primaryKonvaShapeSelection returns the last selected id", () => {
  assert.equal(primaryKonvaShapeSelection(["a", "b", "c"]), "c");
  assert.equal(primaryKonvaShapeSelection([]), null);
});

test("konvaSelectionBoxIsDrag ignores tiny pointer jitter", () => {
  assert.equal(konvaSelectionBoxIsDrag({ x: 0, y: 0, width: 2, height: 2 }), false);
  assert.equal(konvaSelectionBoxIsDrag({ x: 0, y: 0, width: 4, height: 0 }), true);
});
