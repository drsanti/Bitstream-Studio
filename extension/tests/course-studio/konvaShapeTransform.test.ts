import assert from "node:assert/strict";
import test from "node:test";

import { bakeKonvaGroupFromNode } from "../../src/webview/course-studio/runtime/diagram/konvaShapeTransform";

test("bakeKonvaGroupFromNode scales children into stored geometry", () => {
  const shape = {
    id: "group-1",
    type: "group" as const,
    x: 10,
    y: 20,
    children: [
      { id: "a", type: "rect" as const, x: 0, y: 0, width: 40, height: 20 },
      { id: "b", type: "rect" as const, x: 50, y: 10, width: 20, height: 20 },
    ],
  };

  const node = {
    x: () => 10,
    y: () => 20,
    rotation: () => 0,
    scaleX: () => 2,
    scaleY: () => 2,
  };

  const baked = bakeKonvaGroupFromNode(shape, node as never);
  assert.equal(baked.x, 10);
  assert.equal(baked.y, 20);
  assert.equal(baked.children[0]?.type, "rect");
  assert.equal((baked.children[0] as { width: number }).width, 80);
  assert.equal((baked.children[0] as { height: number }).height, 40);
  assert.equal((baked.children[1] as { x: number }).x, 100);
  assert.equal((baked.children[1] as { y: number }).y, 20);
});
