import assert from "node:assert/strict";
import test from "node:test";

import { presentationBmi270FromSample } from "../../src/webview/presentation/display/selectors";
import { diagramLiveSnapshot } from "./diagramLiveSnapshotFixtures";
import type { DiagramLiveSnapshot } from "../../src/webview/course-studio/runtime/diagram/diagramBindingCatalog";
import {
  isDiagramLinkHealthy,
  resolveDiagramRenderSnapshot,
} from "../../src/webview/course-studio/runtime/diagram/diagramLinkHealth";

const staleSnapshot = diagramLiveSnapshot({ connected: false });

const liveSnapshot = diagramLiveSnapshot({
  connected: true,
  bmi270: { ...presentationBmi270FromSample(null), hasSample: true, ax: 0.02 },
});

test("isDiagramLinkHealthy requires connection and BMI270 sample", () => {
  assert.equal(isDiagramLinkHealthy(staleSnapshot), false);
  assert.equal(isDiagramLinkHealthy(liveSnapshot), true);
});

test("freeze-gray policy keeps last good snapshot and marks inactive", () => {
  const resolved = resolveDiagramRenderSnapshot({
    current: staleSnapshot,
    lastGood: liveSnapshot,
    policy: "freeze-gray",
  });
  assert.equal(resolved.inactive, true);
  assert.equal(resolved.snapshot.bmi270.ax, liveSnapshot.bmi270.ax);
});

test("hide policy hides diagram when unhealthy", () => {
  const resolved = resolveDiagramRenderSnapshot({
    current: staleSnapshot,
    lastGood: liveSnapshot,
    policy: "hide",
  });
  assert.equal(resolved.hidden, true);
});
