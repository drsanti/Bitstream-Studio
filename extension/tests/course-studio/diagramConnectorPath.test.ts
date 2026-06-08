import assert from "node:assert/strict";
import { test } from "node:test";
import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import {
  buildQuadraticConnectorPath,
  connectorBounds,
  defaultQuadraticControl,
  hasConnectorCurve,
} from "../../src/webview/course-studio/runtime/diagram/diagramConnectorPath";
import { patchDiagramNode } from "../../src/webview/course-studio/runtime/diagram/diagramNodeMutations";

test("parseDiagramV1 accepts line with quadratic curve", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "curve-test",
    viewBox: [0, 0, 200, 200],
    nodes: [
      {
        id: "wire",
        type: "line",
        x1: 10,
        y1: 10,
        x2: 190,
        y2: 10,
        curve: { cx: 100, cy: 60 },
        stroke: "card",
      },
    ],
  });
  const wire = diagram.nodes[0];
  assert.ok(wire != null && wire.type === "line");
  assert.ok(hasConnectorCurve(wire));
  assert.equal(
    buildQuadraticConnectorPath(wire, wire.curve),
    "M 10 10 Q 100 60 190 10",
  );
});

test("defaultQuadraticControl offsets perpendicular to segment", () => {
  const curve = defaultQuadraticControl({ x1: 0, y1: 0, x2: 100, y2: 0 }, 20);
  assert.equal(curve.cx, 50);
  assert.equal(Math.abs(curve.cy), 20);
});

test("patchDiagramNode stores curve control updates", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "curve-patch",
    viewBox: [0, 0, 200, 200],
    nodes: [
      {
        id: "wire",
        type: "arrow",
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        curve: { cx: 50, cy: 20 },
      },
    ],
  });
  const next = patchDiagramNode(diagram, "wire", { curveCx: 48, curveCy: 32 });
  const wire = next.nodes[0];
  assert.ok(wire != null && wire.type === "arrow" && hasConnectorCurve(wire));
  assert.equal(wire.curve.cx, 48);
  assert.equal(wire.curve.cy, 32);
});

test("connectorBounds includes curve control point", () => {
  const bounds = connectorBounds(
    { x1: 0, y1: 0, x2: 100, y2: 0 },
    { cx: 50, cy: 40 },
  );
  assert.equal(bounds.y, -10);
  assert.equal(bounds.height, 60);
});
