import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  snapKonvaCanvasPoint,
  snapKonvaShapeGeometry,
} from "../../src/webview/course-studio/runtime/diagram/konvaAlignmentSnap";
import type { KonvaShapeV1 } from "../../src/webview/course-studio/schemas/konvaShapes";

describe("snapKonvaCanvasPoint", () => {
  it("snaps to grid when no peer targets", () => {
    const result = snapKonvaCanvasPoint({ x: 11, y: 13, targets: [] });
    assert.equal(result.x, 12);
    assert.equal(result.y, 12);
    assert.equal(result.guides.length, 0);
  });

  it("snaps to peer edge lines within threshold", () => {
    const result = snapKonvaCanvasPoint({
      x: 102,
      y: 52,
      targets: [{ x: 100, y: 50, width: 40, height: 20 }],
    });
    assert.equal(result.x, 100);
    assert.equal(result.y, 50);
    assert.equal(result.guides.length, 2);
  });

  it("bypasses snap when disabled", () => {
    const result = snapKonvaCanvasPoint({
      x: 11,
      y: 13,
      targets: [{ x: 100, y: 50, width: 40, height: 20 }],
      snapEnabled: false,
    });
    assert.equal(result.x, 11);
    assert.equal(result.y, 13);
    assert.equal(result.guides.length, 0);
  });
});

describe("snapKonvaShapeGeometry", () => {
  it("snaps rect position and size to grid", () => {
    const shape: KonvaShapeV1 = {
      id: "r1",
      type: "rect",
      x: 11,
      y: 9,
      width: 33,
      height: 27,
    };
    const snapped = snapKonvaShapeGeometry(shape, []);
    assert.equal(snapped.type, "rect");
    if (snapped.type === "rect") {
      assert.equal(snapped.x, 12);
      assert.equal(snapped.y, 8);
      assert.equal(snapped.width, 32);
      assert.equal(snapped.height, 28);
    }
  });
});
