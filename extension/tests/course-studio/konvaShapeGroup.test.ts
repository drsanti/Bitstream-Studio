import assert from "node:assert/strict";
import test from "node:test";

import {
  groupKonvaShapes,
  ungroupKonvaShape,
  canGroupKonvaShapes,
  canUngroupKonvaShape,
} from "../../src/webview/course-studio/runtime/diagram/konvaShapeGroup";
import { flattenKonvaShapesToWorld } from "../../src/webview/course-studio/runtime/diagram/konvaShapeTree";
import { resolveKonvaConnectorShape } from "../../src/webview/course-studio/runtime/diagram/konvaConnectorPath";

test("groupKonvaShapes nests selected shapes at union-bbox origin", () => {
  const shapes = [
    { id: "a", type: "rect" as const, x: 10, y: 20, width: 40, height: 30 },
    { id: "b", type: "rect" as const, x: 80, y: 50, width: 20, height: 20 },
  ];
  const grouped = groupKonvaShapes(shapes, ["a", "b"]);
  assert.ok(grouped != null);
  const group = grouped.find((entry) => entry.type === "group");
  assert.ok(group != null && group.type === "group");
  assert.equal(group.x, 10);
  assert.equal(group.y, 20);
  assert.equal(group.children.length, 2);
  assert.deepEqual(group.children[0], {
    id: "a",
    type: "rect",
    x: 0,
    y: 0,
    width: 40,
    height: 30,
  });
  assert.deepEqual(group.children[1], {
    id: "b",
    type: "rect",
    x: 70,
    y: 30,
    width: 20,
    height: 20,
  });
});

test("ungroupKonvaShape restores absolute coordinates", () => {
  const shapes = [
    {
      id: "group-1",
      type: "group" as const,
      x: 10,
      y: 20,
      children: [
        { id: "a", type: "rect" as const, x: 0, y: 0, width: 40, height: 30 },
        { id: "b", type: "rect" as const, x: 70, y: 30, width: 20, height: 20 },
      ],
    },
  ];
  const ungrouped = ungroupKonvaShape(shapes, "group-1");
  assert.ok(ungrouped != null);
  assert.equal(ungrouped.length, 2);
  assert.deepEqual(ungrouped[0], {
    id: "a",
    type: "rect",
    x: 10,
    y: 20,
    width: 40,
    height: 30,
  });
  assert.deepEqual(ungrouped[1], {
    id: "b",
    type: "rect",
    x: 80,
    y: 50,
    width: 20,
    height: 20,
  });
});

test("flattenKonvaShapesToWorld resolves grouped leaf positions", () => {
  const shapes = [
    {
      id: "group-1",
      type: "group" as const,
      x: 100,
      y: 50,
      children: [{ id: "a", type: "rect" as const, x: 10, y: 5, width: 30, height: 20 }],
    },
  ];
  const flat = flattenKonvaShapesToWorld(shapes);
  assert.equal(flat.length, 1);
  assert.equal(flat[0]?.type, "rect");
  assert.equal((flat[0] as { x: number }).x, 110);
  assert.equal((flat[0] as { y: number }).y, 55);
});

test("resolveKonvaConnectorShape follows grouped rect attach points", () => {
  const shapes = [
    {
      id: "group-1",
      type: "group" as const,
      x: 100,
      y: 0,
      children: [{ id: "rect-1", type: "rect" as const, x: 0, y: 0, width: 100, height: 40 }],
    },
    {
      id: "line-1",
      type: "line" as const,
      x1: 0,
      y1: 0,
      x2: 300,
      y2: 0,
      startAttach: { shapeId: "rect-1", anchor: "e" as const },
    },
  ];
  const world = flattenKonvaShapesToWorld(shapes);
  const resolved = resolveKonvaConnectorShape(shapes[1]!, world);
  assert.equal(resolved.x1, 200);
  assert.equal(resolved.y1, 20);
});

import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";

test("parseDiagramV1 accepts konva group shapes", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "test-group",
    title: "Group test",
    viewBox: [0, 0, 800, 600],
    freeform: {
      engine: "konva",
      shapes: [
        {
          id: "g1",
          type: "group",
          x: 10,
          y: 20,
          children: [
            { id: "a", type: "rect", x: 0, y: 0, width: 40, height: 30 },
          ],
        },
      ],
    },
  });
  assert.equal(diagram.freeform?.shapes?.[0]?.type, "group");
});

test("canGroupKonvaShapes ignores connectors in mixed selection", () => {
  const shapes = [
    { id: "a", type: "rect" as const, x: 0, y: 0, width: 10, height: 10 },
    { id: "b", type: "rect" as const, x: 20, y: 0, width: 10, height: 10 },
    { id: "l1", type: "line" as const, x1: 0, y1: 0, x2: 10, y2: 10 },
  ];
  assert.equal(canGroupKonvaShapes(shapes, ["a", "b", "l1"]), true);
});

test("groupKonvaShapes can nest an existing group with a rect", () => {
  const shapes = [
    {
      id: "group-1",
      type: "group" as const,
      x: 0,
      y: 0,
      children: [{ id: "a", type: "rect" as const, x: 0, y: 0, width: 20, height: 20 }],
    },
    { id: "b", type: "rect" as const, x: 50, y: 0, width: 20, height: 20 },
  ];
  const grouped = groupKonvaShapes(shapes, ["group-1", "b"]);
  assert.ok(grouped != null);
  const outer = grouped.find((entry) => entry.type === "group" && entry.id !== "group-1");
  assert.ok(outer != null && outer.type === "group");
  assert.equal(outer.children.length, 2);
});

test("ungroupKonvaShape unwraps nested group in place", () => {
  const shapes = [
    {
      id: "outer",
      type: "group" as const,
      x: 100,
      y: 50,
      children: [
        {
          id: "inner",
          type: "group" as const,
          x: 10,
          y: 5,
          children: [{ id: "a", type: "rect" as const, x: 0, y: 0, width: 30, height: 20 }],
        },
      ],
    },
  ];
  const ungrouped = ungroupKonvaShape(shapes, "inner");
  assert.ok(ungrouped != null);
  const outer = ungrouped[0];
  assert.ok(outer != null && outer.type === "group");
  assert.equal(outer.children.length, 1);
  assert.equal(outer.children[0]?.type, "rect");
  assert.equal((outer.children[0] as { x: number }).x, 10);
  assert.equal((outer.children[0] as { y: number }).y, 5);
});

test("canGroupKonvaShapes rejects connectors-only selection", () => {
  const shapes = [
    { id: "a", type: "rect" as const, x: 0, y: 0, width: 10, height: 10 },
    { id: "l1", type: "line" as const, x1: 0, y1: 0, x2: 10, y2: 10 },
  ];
  assert.equal(canGroupKonvaShapes(shapes, ["a", "l1"]), false);
  assert.equal(canUngroupKonvaShape(shapes, ["a"]), false);
});
