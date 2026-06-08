import assert from "node:assert/strict";
import test from "node:test";

import {
  readClampMapOp,
  withClampMapOp,
  withScaleMapOp,
} from "../../src/webview/course-studio/runtime/diagram/diagramNodeMutations";
import type { DiagramBindingV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import { applyMapOps } from "../../src/webview/course-studio/runtime/diagram/evaluateDiagramScene";

test("withClampMapOp appends clamp and preserves scale", () => {
  const binding: DiagramBindingV1 = {
    path: "bmi270.ax",
    map: [{ op: "scale", inMin: -1, inMax: 1, outMin: -20, outMax: 20 }],
  };
  const next = withClampMapOp(binding, { op: "clamp", min: -10, max: 10 });
  assert.equal(next.map?.length, 2);
  assert.equal(readClampMapOp(next)?.max, 10);
});

test("applyMapOps runs scale then clamp in order", () => {
  const value = applyMapOps(2, [
    { op: "scale", inMin: -1, inMax: 1, outMin: -20, outMax: 20 },
    { op: "clamp", min: -10, max: 10 },
  ]);
  assert.equal(value, 10);
});

test("withScaleMapOp replaces existing scale op", () => {
  const binding: DiagramBindingV1 = {
    path: "bmi270.ax",
    map: [
      { op: "scale", inMin: 0, inMax: 1, outMin: 0, outMax: 1 },
      { op: "clamp", min: 0, max: 1 },
    ],
  };
  const next = withScaleMapOp(binding, {
    op: "scale",
    inMin: -1,
    inMax: 1,
    outMin: 14,
    outMax: -14,
  });
  assert.equal(next.map?.length, 2);
  assert.equal(next.map?.[0]?.op, "scale");
  assert.equal(next.map?.[1]?.op, "clamp");
});
