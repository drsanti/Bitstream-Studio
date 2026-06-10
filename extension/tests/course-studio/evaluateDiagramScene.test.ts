import assert from "node:assert/strict";
import test from "node:test";

import {
  applyMapOps,
  evaluateNumericProp,
  evaluateTextProp,
} from "../../src/webview/course-studio/runtime/diagram/evaluateDiagramScene";
import type { DiagramLiveSnapshot } from "../../src/webview/course-studio/runtime/diagram/diagramBindingCatalog";
import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import { presentationBmi270FromSample } from "../../src/webview/presentation/display/selectors";
import pilotMemsDiagramJson from "../../src/webview/course-studio/content/pilot-bmi-accel-mems.diagram.v1.json";
import { diagramLiveSnapshot } from "./diagramLiveSnapshotFixtures";

const snapshot = diagramLiveSnapshot({ connected: true });

test("parseDiagramV1 accepts pilot MEMS diagram JSON", () => {
  const diagram = parseDiagramV1(pilotMemsDiagramJson);
  assert.equal(diagram.id, "pilot-bmi-accel-mems");
  assert.ok(diagram.nodes.some((node) => node.id === "proof-mass"));
});

test("applyMapOps scales and clamps binding values", () => {
  const scaled = applyMapOps(0.5, [
    { op: "scale", inMin: -1, inMax: 1, outMin: -20, outMax: 20 },
    { op: "clamp", min: -10, max: 10 },
  ]);
  assert.equal(scaled, 10);
});

test("evaluateNumericProp applies additive bindings from live paths", () => {
  const next: DiagramLiveSnapshot = {
    ...snapshot,
    bmi270: { ...snapshot.bmi270, ax: 1 },
  };
  const y = evaluateNumericProp(
    {
      base: 80,
      mode: "add",
      binding: {
        path: "bmi270.ax",
        map: [{ op: "scale", inMin: -1, inMax: 1, outMin: 10, outMax: -10 }],
      },
    },
    next,
  );
  assert.equal(y, 70);
});

test("evaluateTextProp formats bound text with unit suffix", () => {
  const next: DiagramLiveSnapshot = {
    ...snapshot,
    bmi270: { ...snapshot.bmi270, ax: 0.125 },
  };
  const label = evaluateTextProp(
    {
      binding: { path: "bmi270.ax", format: "0.000", unit: "g" },
      prefix: "aX = ",
    },
    next,
  );
  assert.equal(label, "aX = 0.125 g");
});

test("pilot MEMS proof-mass Y resolves golden frame from ax binding", () => {
  const diagram = parseDiagramV1(pilotMemsDiagramJson);
  const proofMass = diagram.nodes.find((n) => n.id === "proof-mass");
  assert.ok(proofMass != null && proofMass.type === "rect");

  const atZero = diagramLiveSnapshot({
    connected: true,
    bmi270: { ...presentationBmi270FromSample(null), ax: 0 },
  });
  assert.equal(evaluateNumericProp(proofMass.y, atZero), 78);

  const atOne = diagramLiveSnapshot({
    connected: true,
    bmi270: { ...presentationBmi270FromSample(null), ax: 1 },
  });
  assert.equal(evaluateNumericProp(proofMass.y, atOne), 64);
});
