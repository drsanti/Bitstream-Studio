import assert from "node:assert/strict";
import test from "node:test";

import {
  clampKonvaRectCornerRadiusFields,
  getKonvaRectCornerRadii,
  konvaRectMaxCornerRadius,
  konvaRectRadiusFromLocalPoint,
  nudgeKonvaRectCornerRadius,
  setKonvaRectUniformCornerRadius,
} from "../../src/webview/course-studio/runtime/diagram/konvaCornerRadius";
import { patchKonvaShape } from "../../src/webview/course-studio/runtime/diagram/konvaShapeMutations";

const baseRect = {
  id: "rect-1",
  type: "rect" as const,
  x: 0,
  y: 0,
  width: 100,
  height: 40,
};

test("konvaRectMaxCornerRadius uses half of the shorter side", () => {
  assert.equal(konvaRectMaxCornerRadius(100, 40), 20);
  assert.equal(konvaRectMaxCornerRadius(80, 80), 40);
});

test("setKonvaRectUniformCornerRadius clamps to rect bounds", () => {
  const next = setKonvaRectUniformCornerRadius(baseRect, 999);
  assert.equal(next.cornerRadius, 20);
  assert.equal(next.cornerRadii, undefined);
});

test("konvaRectRadiusFromLocalPoint derives bottom-right radius from local point", () => {
  assert.equal(konvaRectRadiusFromLocalPoint(2, 88, 28, 100, 40), 12);
});

test("patchKonvaShape clears cornerRadii when setting uniform cornerRadius", () => {
  const shapes = patchKonvaShape(
    [{ ...baseRect, cornerRadii: [4, 8, 12, 16] }],
    "rect-1",
    { cornerRadius: 6 },
  );
  const rect = shapes[0];
  assert.equal(rect?.type, "rect");
  if (rect?.type !== "rect") {
    return;
  }
  assert.equal(rect.cornerRadius, 6);
  assert.equal(rect.cornerRadii, undefined);
});

test("clampKonvaRectCornerRadiusFields collapses uniform cornerRadii to cornerRadius", () => {
  const next = clampKonvaRectCornerRadiusFields({
    ...baseRect,
    cornerRadii: [8, 8, 8, 8],
  });
  assert.equal(next.cornerRadius, 8);
  assert.equal(next.cornerRadii, undefined);
});

test("nudgeKonvaRectCornerRadius respects max radius", () => {
  const next = nudgeKonvaRectCornerRadius({ ...baseRect, cornerRadius: 19 }, 4);
  assert.equal(next.cornerRadius, 20);
});

test("getKonvaRectCornerRadii expands uniform radius to four corners", () => {
  assert.deepEqual(getKonvaRectCornerRadii({ ...baseRect, cornerRadius: 5 }), [5, 5, 5, 5]);
});
