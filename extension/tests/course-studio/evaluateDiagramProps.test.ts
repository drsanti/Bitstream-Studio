import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateDiagramProps,
  findResolvedNode,
} from "../../src/webview/course-studio/runtime/diagram/evaluateDiagramProps";
import type { DiagramLiveSnapshot } from "../../src/webview/course-studio/runtime/diagram/diagramBindingCatalog";
import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import { presentationBmi270FromSample } from "../../src/webview/presentation/display/selectors";
import pilotMemsDiagramJson from "../../src/webview/course-studio/content/pilot-bmi-accel-mems.diagram.v1.json";

const diagram = parseDiagramV1(pilotMemsDiagramJson);

function snapshotWithAx(ax: number, accValid = true): DiagramLiveSnapshot {
  return {
    bmi270: {
      ...presentationBmi270FromSample(null),
      ax,
      accValid,
      hasSample: accValid,
    },
    connected: true,
  };
}

test("evaluateDiagramProps resolves proof-mass position golden frames", () => {
  const atRest = evaluateDiagramProps(diagram, snapshotWithAx(0));
  const proofRest = findResolvedNode(atRest, "proof-mass");
  assert.equal(proofRest?.y, 78);

  const tilted = evaluateDiagramProps(diagram, snapshotWithAx(1));
  const proofTilt = findResolvedNode(tilted, "proof-mass");
  assert.equal(proofTilt?.y, 64);
});

test("evaluateDiagramProps resolves live ax label text", () => {
  const resolved = evaluateDiagramProps(diagram, snapshotWithAx(0.25));
  const label = findResolvedNode(resolved, "live-ax");
  assert.equal(label?.content, "aX = 0.250 g");
});

test("pipeline springs flow when accel valid and highlight on |ax|", () => {
  const idle = evaluateDiagramProps(diagram, snapshotWithAx(0, false), { linkHealthy: true });
  const springIdle = findResolvedNode(idle, "spring-left");
  assert.equal(springIdle?.flowActive, false);
  assert.equal(springIdle?.highlighted, false);

  const live = evaluateDiagramProps(diagram, snapshotWithAx(0.02, true), { linkHealthy: true });
  const springLive = findResolvedNode(live, "spring-left");
  assert.equal(springLive?.flowActive, true);
  assert.equal(springLive?.highlighted, false);

  const active = evaluateDiagramProps(diagram, snapshotWithAx(0.35, true), { linkHealthy: true });
  const springActive = findResolvedNode(active, "spring-left");
  assert.equal(springActive?.flowActive, true);
  assert.equal(springActive?.highlighted, true);
});

test("evaluateDiagramProps pauses dashed flow when link unhealthy", () => {
  const resolved = evaluateDiagramProps(diagram, snapshotWithAx(0.35, true), {
    linkHealthy: false,
  });
  const spring = findResolvedNode(resolved, "spring-left");
  assert.equal(spring?.flowActive, false);
});
