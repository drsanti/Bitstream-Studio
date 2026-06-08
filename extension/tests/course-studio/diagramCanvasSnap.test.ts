import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { snapDiagramCoord, DIAGRAM_SNAP_GRID } from "../../src/webview/course-studio/runtime/diagram/diagramCanvasSnap";
import { buildRectResizePatch } from "../../src/webview/course-studio/runtime/diagram/diagramNodeMutations";

describe("diagramCanvasSnap", () => {
  test("snapDiagramCoord rounds to grid", () => {
    assert.equal(snapDiagramCoord(0), 0);
    assert.equal(snapDiagramCoord(3), 4);
    assert.equal(snapDiagramCoord(5), 4);
    assert.equal(snapDiagramCoord(6), 8);
    assert.equal(DIAGRAM_SNAP_GRID, 4);
  });
});

describe("buildRectResizePatch", () => {
  test("se handle updates width and height with minimum size", () => {
    const patch = buildRectResizePatch({ width: 40, height: 30 }, "se", 10, 6);
    assert.deepEqual(patch, { width: 52, height: 36 });
  });

  test("e handle only updates width", () => {
    const patch = buildRectResizePatch({ width: 40, height: 30 }, "e", -40, 0);
    assert.deepEqual(patch, { width: 8 });
  });
});
