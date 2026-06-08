import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { presentationBmi270FromSample } from "../../src/webview/presentation/display/selectors";
import type { DiagramLiveSnapshot } from "../../src/webview/course-studio/runtime/diagram/diagramBindingCatalog";
import {
  isCourseLinkHealthy,
  resolveCourseLastRxAtMs,
} from "../../src/webview/course-studio/runtime/courseTelemetryFreshness";
import {
  isDiagramLinkHealthy,
  resolveDiagramRenderSnapshot,
} from "../../src/webview/course-studio/runtime/diagram/diagramLinkHealth";

const liveSnapshot: DiagramLiveSnapshot = {
  bmi270: { ...presentationBmi270FromSample(null), hasSample: true, ax: 0.02 },
  connected: true,
};

describe("courseTelemetryFreshness", () => {
  test("resolveCourseLastRxAtMs prefers BS2 EVT_SENSOR timestamp", () => {
    assert.equal(resolveCourseLastRxAtMs(1000, 500), 1000);
    assert.equal(resolveCourseLastRxAtMs(null, 500), 500);
  });

  test("isCourseLinkHealthy ignores age when staleMs is unset", () => {
    assert.equal(
      isCourseLinkHealthy({
        snapshot: liveSnapshot,
        nowMs: 10_000,
        lastRxAtMs: 100,
        staleMs: undefined,
      }),
      true,
    );
  });

  test("isCourseLinkHealthy marks aged samples stale when staleMs is set", () => {
    assert.equal(
      isCourseLinkHealthy({
        snapshot: liveSnapshot,
        nowMs: 5000,
        lastRxAtMs: 1000,
        staleMs: 2000,
      }),
      false,
    );
    assert.equal(
      isCourseLinkHealthy({
        snapshot: liveSnapshot,
        nowMs: 2500,
        lastRxAtMs: 1000,
        staleMs: 2000,
      }),
      true,
    );
  });
});

describe("diagramLinkHealth staleMs", () => {
  test("isDiagramLinkHealthy applies freshness when provided", () => {
    assert.equal(isDiagramLinkHealthy(liveSnapshot), true);
    assert.equal(
      isDiagramLinkHealthy(liveSnapshot, {
        nowMs: 9000,
        lastRxAtMs: 1000,
        staleMs: 2000,
      }),
      false,
    );
  });

  test("freeze-gray uses stale freshness for inactive render", () => {
    const resolved = resolveDiagramRenderSnapshot({
      current: liveSnapshot,
      lastGood: liveSnapshot,
      policy: "freeze-gray",
      freshness: {
        nowMs: 9000,
        lastRxAtMs: 1000,
        staleMs: 2000,
      },
    });
    assert.equal(resolved.inactive, true);
    assert.equal(resolved.hidden, false);
  });
});
