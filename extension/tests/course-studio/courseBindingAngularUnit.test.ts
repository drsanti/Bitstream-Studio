import assert from "node:assert/strict";
import test from "node:test";

import {
  applyBindingAngularDisplay,
  catalogAngularKind,
  resolveAngularDisplayUnit,
} from "../../src/webview/course-studio/runtime/diagram/courseBindingAngularUnit";
import {
  resolveBindingDisplayUnit,
  resolveDiagramBindingPath,
} from "../../src/webview/course-studio/runtime/diagram/diagramBindingCatalog";
import { resolveBindingNumber } from "../../src/webview/course-studio/runtime/diagram/evaluateDiagramScene";
import { presentationBmi270FromSample } from "../../src/webview/presentation/display/selectors";
import { diagramLiveSnapshot } from "./diagramLiveSnapshotFixtures";

test("catalogAngularKind classifies gyro, fusion, and BMM350 heading paths", () => {
  assert.equal(catalogAngularKind("bmi270.gyrMag"), "rate");
  assert.equal(catalogAngularKind("bmi270.heading"), "angle");
  assert.equal(catalogAngularKind("bmm350.headingDeg"), "angle");
  assert.equal(catalogAngularKind("bmi270.ax"), null);
});

test("applyBindingAngularDisplay converts degrees to radians", () => {
  const binding = { path: "bmi270.gx", fallback: 0, angularUnit: "rad" as const };
  assert.equal(applyBindingAngularDisplay(180, binding), Math.PI);
  assert.equal(applyBindingAngularDisplay(180, { ...binding, angularUnit: "deg" }), 180);
});

test("resolveBindingDisplayUnit honors angularUnit", () => {
  assert.equal(
    resolveBindingDisplayUnit({ path: "bmi270.gyrMag", fallback: 0, angularUnit: "rad" }),
    "rad/s",
  );
  assert.equal(
    resolveBindingDisplayUnit({ path: "bmi270.heading", fallback: 0, angularUnit: "rad" }),
    "rad",
  );
  assert.equal(resolveAngularDisplayUnit({ path: "bmi270.gx", fallback: 0 }, "rate"), "°/s");
});

test("resolveBindingNumber applies angularUnit after map ops", () => {
  const snapshot = diagramLiveSnapshot({
    connected: true,
    bmi270: {
      ...presentationBmi270FromSample(null),
      gx: 180,
      hasSample: true,
    },
  });
  const deg = resolveBindingNumber({ path: "bmi270.gx", fallback: 0 }, snapshot);
  assert.equal(deg, 180);
  const rad = resolveBindingNumber(
    { path: "bmi270.gx", fallback: 0, angularUnit: "rad" },
    snapshot,
  );
  assert.ok(Math.abs(rad - Math.PI) < 1e-9);
});

test("gyrMag in rad/s is hypot of component rad/s values", () => {
  const snapshot = diagramLiveSnapshot({
    connected: true,
    bmi270: {
      ...presentationBmi270FromSample(null),
      gx: 3,
      gy: 4,
      gz: 0,
      hasSample: true,
    },
  });
  assert.equal(resolveDiagramBindingPath("bmi270.gyrMag", snapshot), 5);
  const radMag = resolveBindingNumber(
    { path: "bmi270.gyrMag", fallback: 0, angularUnit: "rad" },
    snapshot,
  );
  assert.ok(Math.abs(radMag - 5 * (Math.PI / 180)) < 1e-9);
});
