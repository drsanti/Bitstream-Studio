import assert from "node:assert/strict";
import { test } from "node:test";
import {
  snapDiagramDragDelta,
  type DiagramAlignBounds,
} from "../../src/webview/course-studio/runtime/diagram/diagramAlignmentSnap";

const boxA: DiagramAlignBounds = { x: 20, y: 20, width: 40, height: 30 };
const boxB: DiagramAlignBounds = { x: 100, y: 20, width: 40, height: 30 };

test("snapDiagramDragDelta aligns left edges within threshold", () => {
  const startBounds: DiagramAlignBounds = { x: 24, y: 40, width: 40, height: 30 };
  const result = snapDiagramDragDelta({
    startBounds,
    dx: 72,
    dy: 0,
    targets: [boxB],
    snapX: true,
    snapY: true,
  });
  assert.equal(startBounds.x + result.dx, 100);
  assert.ok(result.guides.some((guide) => guide.axis === "x" && guide.position === 100));
});

test("snapDiagramDragDelta aligns vertical centers", () => {
  const startBounds: DiagramAlignBounds = { x: 40, y: 33, width: 20, height: 20 };
  const result = snapDiagramDragDelta({
    startBounds,
    dx: 0,
    dy: 2,
    targets: [boxA],
    snapX: false,
    snapY: true,
  });
  assert.equal(startBounds.y + result.dy, 35);
  assert.ok(result.guides.some((guide) => guide.axis === "y" && guide.position === 35));
});

test("snapDiagramDragDelta ignores targets outside threshold", () => {
  const startBounds: DiagramAlignBounds = { x: 0, y: 0, width: 20, height: 20 };
  const farTarget: DiagramAlignBounds = { x: 200, y: 200, width: 40, height: 40 };
  const result = snapDiagramDragDelta({
    startBounds,
    dx: 50,
    dy: 0,
    targets: [farTarget],
    threshold: 4,
  });
  assert.equal(result.guides.length, 0);
  assert.equal(result.dx, 52);
});
