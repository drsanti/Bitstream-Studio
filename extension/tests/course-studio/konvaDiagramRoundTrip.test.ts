import assert from "node:assert/strict";
import test from "node:test";

import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import { flattenKonvaShapesToWorld } from "../../src/webview/course-studio/runtime/diagram/konvaShapeTree";
import { resolveKonvaConnectors } from "../../src/webview/course-studio/runtime/diagram/konvaConnectorPath";
import { groupKonvaShapes, ungroupKonvaShape } from "../../src/webview/course-studio/runtime/diagram/konvaShapeGroup";
import { buildKonvaConnectorPathData } from "../../src/webview/course-studio/runtime/diagram/konvaConnectorPath";

const COMPLEX_FREEform = {
  engine: "konva" as const,
  view: { width: 800, height: 600, background: "#000000" },
  shapes: [
    {
      id: "outer",
      type: "group" as const,
      x: 50,
      y: 40,
      children: [
        {
          id: "inner",
          type: "group" as const,
          x: 10,
          y: 5,
          children: [
            { id: "rect-a", type: "rect" as const, x: 0, y: 0, width: 80, height: 40 },
          ],
        },
        { id: "rect-b", type: "rect" as const, x: 100, y: 20, width: 60, height: 30 },
      ],
    },
    {
      id: "line-1",
      type: "line" as const,
      x1: 0,
      y1: 0,
      x2: 400,
      y2: 200,
      pathMode: "orthogonal" as const,
      waypoints: [{ x: 200, y: 0 }],
      startAttach: { shapeId: "rect-a", anchor: "e" as const },
      endAttach: { shapeId: "rect-b", anchor: "w" as const },
    },
  ],
};

test("parseDiagramV1 round-trips nested Konva groups and orthogonal connector", () => {
  const parsed = parseDiagramV1({
    version: 1,
    id: "round-trip-konva",
    title: "Round trip",
    viewBox: [0, 0, 800, 600],
    freeform: COMPLEX_FREEform,
  });

  assert.equal(parsed.freeform?.shapes?.length, 2);
  const reparsed = parseDiagramV1({
    version: 1,
    id: parsed.id,
    title: parsed.title,
    viewBox: parsed.viewBox,
    freeform: parsed.freeform,
  });
  assert.deepEqual(reparsed.freeform?.shapes, parsed.freeform?.shapes);
});

test("group then ungroup round-trips leaf coordinates", () => {
  const shapes = [
    { id: "a", type: "rect" as const, x: 10, y: 20, width: 40, height: 30 },
    { id: "b", type: "rect" as const, x: 80, y: 50, width: 20, height: 20 },
    {
      id: "line-1",
      type: "line" as const,
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
      startAttach: { shapeId: "a", anchor: "e" as const },
    },
  ];
  const grouped = groupKonvaShapes(shapes, ["a", "b"]);
  assert.ok(grouped != null);
  const serialized = parseDiagramV1({
    version: 1,
    id: "g",
    title: "G",
    viewBox: [0, 0, 800, 600],
    freeform: { engine: "konva", shapes: grouped },
  });
  assert.equal(serialized.freeform?.shapes?.some((s) => s.type === "group"), true);

  const group = grouped.find((entry) => entry.type === "group");
  assert.ok(group != null && group.type === "group");
  const ungrouped = ungroupKonvaShape(grouped, group.id);
  assert.ok(ungrouped != null);
  const world = flattenKonvaShapesToWorld(ungrouped);
  const resolved = resolveKonvaConnectors(ungrouped);
  const line = resolved.find((entry) => entry.id === "line-1");
  assert.ok(line != null && line.type === "line");
  assert.equal(line.x1, 50);
  assert.equal(world.find((entry) => entry.id === "a")?.type, "rect");
});

test("orthogonal connector path uses horizontal and vertical segments only", () => {
  const path = buildKonvaConnectorPathData({
    id: "line-1",
    type: "line",
    x1: 0,
    y1: 0,
    x2: 100,
    y2: 50,
    pathMode: "orthogonal",
    waypoints: [{ x: 50, y: 0 }],
  });
  assert.match(path, /^M 0 0/);
  assert.ok(path.includes("L"));
  assert.ok(!path.includes("C"));
  assert.ok(!path.includes("Q"));
});
