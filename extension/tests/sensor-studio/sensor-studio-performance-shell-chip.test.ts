import assert from "node:assert/strict";
import test from "node:test";

import { buildLivePerformanceStats } from "../../src/webview/sensor-studio/core/runtime/sensor-studio-performance-telemetry";
import { DEFAULT_SENSOR_STUDIO_PERFORMANCE_PREFERENCES } from "../../src/webview/sensor-studio/persistence/sensor-studio-performance-preferences";
import {
  formatSensorStudioPerformanceShellChipLabel,
  shouldShowSensorStudioPerformanceShellChip,
} from "../../src/webview/sensor-studio/features/shell/sensor-studio-performance-shell-chip";

test("shouldShowSensorStudioPerformanceShellChip when live stats toggle is on", () => {
  assert.equal(
    shouldShowSensorStudioPerformanceShellChip(
      { ...DEFAULT_SENSOR_STUDIO_PERFORMANCE_PREFERENCES, showLivePerformanceStats: true },
      null,
    ),
    true,
  );
});

test("shouldShowSensorStudioPerformanceShellChip when caps are limited", () => {
  assert.equal(
    shouldShowSensorStudioPerformanceShellChip(
      { ...DEFAULT_SENSOR_STUDIO_PERFORMANCE_PREFERENCES, flowSimulationMaxFps: 30 },
      null,
    ),
    true,
  );
});

test("formatSensorStudioPerformanceShellChipLabel renders sim and 3d fps", () => {
  const stats = buildLivePerformanceStats({
    flowSimulationMaxFps: 30,
    nowMs: 20_000,
    documentHidden: false,
    flowPaneVisible: true,
    dashboardPaneVisible: false,
    stagePaneVisible: true,
    nodeCount: 4,
    edgeCount: 3,
  });
  assert.equal(formatSensorStudioPerformanceShellChipLabel(stats), "Sim —·3D —");
});
