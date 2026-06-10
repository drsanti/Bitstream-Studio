import assert from "node:assert/strict";
import test from "node:test";

import { listKonvaShapeMagnetPorts } from "../../src/webview/course-studio/runtime/diagram/konvaConnectorAnchor";
import {
  buildKonvaConnectorPathData,
  buildOrthogonalPath,
  convertKonvaConnectorPathMode,
  getKonvaConnectorPathMode,
  insertKonvaConnectorBendPoint,
  removeKonvaConnectorBendPointAt,
  removeKonvaConnectorBendPointNear,
  findNearestKonvaConnectorBendIndex,
  resolveKonvaConnectorShape,
  syncKonvaConnectorsForMovedShapes,
} from "../../src/webview/course-studio/runtime/diagram/konvaConnectorPath";
import { snapKonvaConnectorMagnet } from "../../src/webview/course-studio/runtime/diagram/konvaConnectorSnap";

test("getKonvaConnectorPathMode defaults to straight", () => {
  assert.equal(
    getKonvaConnectorPathMode({
      id: "l1",
      type: "line",
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
    }),
    "straight",
  );
});

test("buildKonvaConnectorPathData renders quadratic path", () => {
  const path = buildKonvaConnectorPathData({
    id: "l1",
    type: "line",
    x1: 0,
    y1: 0,
    x2: 100,
    y2: 0,
    pathMode: "quadratic",
    curve: { cx: 50, cy: -24 },
  });
  assert.equal(path, "M 0 0 Q 50 -24 100 0");
});

test("convertKonvaConnectorPathMode preserves endpoints when switching to quadratic", () => {
  const converted = convertKonvaConnectorPathMode(
    {
      id: "l1",
      type: "line",
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
    },
    "quadratic",
  );
  assert.equal(converted.pathMode, "quadratic");
  assert.ok(converted.curve != null);
  assert.equal(converted.x1, 0);
  assert.equal(converted.x2, 100);
});

test("resolveKonvaConnectorShape follows startAttach when rect moves", () => {
  const shapes = [
    { id: "rect-1", type: "rect" as const, x: 10, y: 20, width: 100, height: 40 },
    {
      id: "line-1",
      type: "line" as const,
      x1: 0,
      y1: 0,
      x2: 200,
      y2: 200,
      startAttach: { shapeId: "rect-1", anchor: "e" as const },
    },
  ];
  const resolved = resolveKonvaConnectorShape(shapes[1]!, shapes);
  assert.equal(resolved.x1, 110);
  assert.equal(resolved.y1, 40);
});

test("syncKonvaConnectorsForMovedShapes updates attached connector after shape move", () => {
  const shapes = [
    { id: "rect-1", type: "rect" as const, x: 30, y: 20, width: 100, height: 40 },
    {
      id: "line-1",
      type: "line" as const,
      x1: 110,
      y1: 40,
      x2: 200,
      y2: 200,
      startAttach: { shapeId: "rect-1", anchor: "e" as const },
    },
  ];
  const synced = syncKonvaConnectorsForMovedShapes(shapes, ["rect-1"]);
  const line = synced.find((shape) => shape.id === "line-1");
  assert.equal(line?.type, "line");
  if (line?.type !== "line") {
    return;
  }
  assert.equal(line.x1, 130);
  assert.equal(line.y1, 40);
});

test("snapKonvaConnectorMagnet finds rect edge within threshold", () => {
  const snap = snapKonvaConnectorMagnet({
    x: 110,
    y: 40,
    shapes: [{ id: "rect-1", type: "rect", x: 10, y: 20, width: 100, height: 40 }],
    threshold: 16,
  });
  assert.ok(snap != null);
  assert.equal(snap.shapeId, "rect-1");
  assert.equal(snap.x, 110);
  assert.equal(snap.y, 40);
});

test("insertKonvaConnectorBendPoint adds first waypoint on straight line", () => {
  const next = insertKonvaConnectorBendPoint(
    {
      id: "line-1",
      type: "line",
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
    },
    { x: 50, y: 20 },
  );
  assert.ok(next != null);
  assert.equal(next.pathMode, "spline");
  assert.equal(next.waypoints?.length, 1);
  assert.equal(next.waypoints?.[0]?.x, 50);
  assert.equal(next.waypoints?.[0]?.y, 20);
});

test("insertKonvaConnectorBendPoint appends on existing spline", () => {
  const next = insertKonvaConnectorBendPoint(
    {
      id: "line-1",
      type: "line",
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
      pathMode: "spline",
      waypoints: [{ x: 50, y: 10 }],
    },
    { x: 50, y: 30 },
  );
  assert.ok(next != null);
  assert.equal(next.waypoints?.length, 2);
});

test("buildOrthogonalPath routes with horizontal and vertical segments", () => {
  const path = buildOrthogonalPath([
    { x: 0, y: 0 },
    { x: 100, y: 50 },
  ]);
  assert.match(path, /M 0 0 L 100 0 L 100 50/);
});

test("convertKonvaConnectorPathMode to orthogonal seeds a default corner", () => {
  const next = convertKonvaConnectorPathMode(
    {
      id: "line-1",
      type: "line",
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 40,
    },
    "orthogonal",
  );
  assert.equal(next.pathMode, "orthogonal");
  assert.equal(next.waypoints?.length, 1);
});

test("findNearestKonvaConnectorBendIndex picks closest middle point", () => {
  const shape = {
    id: "line-1",
    type: "line" as const,
    x1: 0,
    y1: 0,
    x2: 100,
    y2: 0,
    pathMode: "spline" as const,
    waypoints: [
      { x: 30, y: 10 },
      { x: 70, y: -10 },
    ],
  };
  assert.equal(findNearestKonvaConnectorBendIndex(shape, { x: 68, y: -8 }), 1);
  assert.equal(findNearestKonvaConnectorBendIndex(shape, { x: 32, y: 9 }), 0);
});

test("removeKonvaConnectorBendPointNear removes nearest bend", () => {
  const next = removeKonvaConnectorBendPointNear(
    {
      id: "line-1",
      type: "line",
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
      pathMode: "spline",
      waypoints: [
        { x: 30, y: 10 },
        { x: 70, y: -10 },
      ],
    },
    { x: 69, y: -9 },
  );
  assert.ok(next != null);
  assert.equal(next.waypoints?.length, 1);
  assert.equal(next.waypoints?.[0]?.x, 30);
});

test("removeKonvaConnectorBendPointAt removes waypoint and reverts to straight", () => {
  const next = removeKonvaConnectorBendPointAt(
    {
      id: "line-1",
      type: "line",
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
      pathMode: "spline",
      waypoints: [{ x: 50, y: 20 }],
    },
    0,
  );
  assert.ok(next != null);
  assert.equal(next.pathMode, "straight");
  assert.equal(next.waypoints, undefined);
});

test("listKonvaShapeMagnetPorts returns rect edge ports", () => {
  const ports = listKonvaShapeMagnetPorts({
    id: "rect-1",
    type: "rect",
    x: 10,
    y: 20,
    width: 100,
    height: 40,
  });
  assert.equal(ports.length, 8);
  assert.ok(ports.some((port) => port.anchor === "e" && port.x === 110));
});
