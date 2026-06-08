import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLivePerformanceStats,
  recordFlowSimulationTick,
  resetPerformanceTelemetryForTests,
} from "../../src/webview/sensor-studio/core/runtime/sensor-studio-performance-telemetry.ts";
import {
  coerceSensorStudioPerformancePreferences,
  minFrameIntervalMs,
  shouldRunCappedFrame,
} from "../../src/webview/sensor-studio/persistence/sensor-studio-performance-preferences.ts";
import {
  collectVisibleWorkbenchEditorTypes,
  readWorkbenchPaneVisibility,
} from "../../src/webview/sensor-studio/core/runtime/studio-workbench-visible-panes.ts";
import type { LayoutNode } from "../../src/webview/ui/workbench/types.ts";

describe("sensor-studio-performance-preferences", () => {
  it("coerces fps presets and live stats toggle", () => {
    assert.deepEqual(
      coerceSensorStudioPerformancePreferences({
        flowSimulationMaxFps: 30,
        stage3dMaxFps: 99,
        showLivePerformanceStats: true,
        showPerformanceOverlay: true,
      }),
      {
        flowSimulationMaxFps: 30,
        stage3dMaxFps: 60,
        showLivePerformanceStats: true,
        showPerformanceOverlay: true,
        flowInteractionTickPolicy: "pause",
        flowInteractionThrottleFps: 10,
        flowInteractionTriggers: { nodeDrag: true, canvasPan: true },
      },
    );
  });

  it("defaults interaction policy when migrating v1 prefs", () => {
    assert.deepEqual(
      coerceSensorStudioPerformancePreferences({
        flowSimulationMaxFps: 15,
        stage3dMaxFps: 24,
      }),
      {
        flowSimulationMaxFps: 15,
        stage3dMaxFps: 24,
        showLivePerformanceStats: false,
        showPerformanceOverlay: false,
        flowInteractionTickPolicy: "pause",
        flowInteractionThrottleFps: 10,
        flowInteractionTriggers: { nodeDrag: true, canvasPan: true },
      },
    );
  });

  it("caps frame intervals", () => {
    assert.equal(minFrameIntervalMs(0), 0);
    assert.ok(Math.abs(minFrameIntervalMs(30) - 33.333) < 0.01);
    assert.equal(shouldRunCappedFrame(100, 0, 0), true);
    assert.equal(shouldRunCappedFrame(110, 100, 50), false);
    assert.equal(shouldRunCappedFrame(160, 100, 50), true);
  });
});

describe("sensor-studio-performance-telemetry", () => {
  it("rolls flow tick fps over one second", () => {
    resetPerformanceTelemetryForTests();
    const t0 = 10_000;
    recordFlowSimulationTick(4, t0);
    recordFlowSimulationTick(5, t0 + 200);
    recordFlowSimulationTick(6, t0 + 400);
    const stats = buildLivePerformanceStats({
      flowSimulationMaxFps: 30,
      nowMs: t0 + 900,
      documentHidden: false,
      flowPaneVisible: true,
      dashboardPaneVisible: false,
      stagePaneVisible: false,
      nodeCount: 3,
      edgeCount: 2,
    });
    assert.equal(stats.flowTickFps, 3);
    assert.ok(stats.flowTickAvgMs != null && stats.flowTickAvgMs > 4);
  });

  it("flags below-cap heavy when tick eval is fast", () => {
    resetPerformanceTelemetryForTests();
    const t0 = 20_000;
    for (let i = 0; i < 3; i += 1) {
      recordFlowSimulationTick(0.6, t0 + i * 300);
    }
    const stats = buildLivePerformanceStats({
      flowSimulationMaxFps: 15,
      nowMs: t0 + 900,
      documentHidden: false,
      flowPaneVisible: true,
      dashboardPaneVisible: false,
      stagePaneVisible: false,
      nodeCount: 11,
      edgeCount: 12,
    });
    assert.equal(stats.flowHeavy, true);
    assert.equal(stats.flowHeavyReason, "below-cap");
  });

  it("flags slow-tick heavy when avg tick ms is high", () => {
    resetPerformanceTelemetryForTests();
    const t0 = 30_000;
    recordFlowSimulationTick(30, t0);
    recordFlowSimulationTick(32, t0 + 100);
    const stats = buildLivePerformanceStats({
      flowSimulationMaxFps: 30,
      nowMs: t0 + 500,
      documentHidden: false,
      flowPaneVisible: true,
      dashboardPaneVisible: false,
      stagePaneVisible: false,
      nodeCount: 4,
      edgeCount: 3,
    });
    assert.equal(stats.flowHeavyReason, "slow-tick");
  });
});

describe("studio-workbench-visible-panes", () => {
  it("collects only expanded panes and active tabs", () => {
    const layout: LayoutNode = {
      type: "split",
      direction: "horizontal",
      ratio: 0.5,
      first: {
        type: "editor",
        id: "flow",
        editorType: "flow",
      },
      second: {
        type: "tabs",
        id: "right-tabs",
        activeIndex: 1,
        panes: [
          {
            type: "editor",
            id: "stage",
            editorType: "stage",
          },
          {
            type: "editor",
            id: "inspector",
            editorType: "inspector",
          },
        ],
      },
    };

    assert.deepEqual(collectVisibleWorkbenchEditorTypes(layout).sort(), [
      "flow",
      "inspector",
    ]);
    assert.deepEqual(
      readWorkbenchPaneVisibility(collectVisibleWorkbenchEditorTypes(layout)),
      {
        stagePaneVisible: false,
        dashboardPaneVisible: false,
        flowPaneVisible: true,
      },
    );
  });

  it("ignores collapsed editor panes", () => {
    const layout: LayoutNode = {
      type: "editor",
      id: "stage",
      editorType: "stage",
      collapsed: true,
      collapseEdge: "right",
    };
    assert.deepEqual(collectVisibleWorkbenchEditorTypes(layout), []);
  });
});
