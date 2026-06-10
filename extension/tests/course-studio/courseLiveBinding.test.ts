import assert from "node:assert/strict";
import test from "node:test";

import { createPageBlock } from "../../src/webview/course-studio/maintainer/blockFactory";
import { evaluateCourseLiveBinding } from "../../src/webview/course-studio/runtime/useCourseLiveBinding";
import { resolveCourseBindingHealthStatus } from "../../src/webview/course-studio/runtime/courseBindingHealth";
import { DIAGRAM_DESIGN_TIME_SNAPSHOT } from "../../src/webview/course-studio/runtime/diagram/diagramDesignTimeSnapshot";
import {
  COURSE_DASHBOARD_WIDGET_DEFAULT_BINDING,
  COURSE_LIVE_METRIC_AXIS_DEFAULTS,
  resolveLiveMetricAxisBinding,
} from "../../src/webview/course-studio/schemas/courseLiveBindingDefaults";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";

test("resolveLiveMetricAxisBinding falls back to BMI270 defaults", () => {
  assert.deepEqual(resolveLiveMetricAxisBinding("ax", undefined), COURSE_LIVE_METRIC_AXIS_DEFAULTS.ax);
  assert.equal(resolveLiveMetricAxisBinding("ay", { path: "bmi270.gy", fallback: 0 }).path, "bmi270.gy");
});

test("evaluateCourseLiveBinding maps path through snapshot", () => {
  const view = evaluateCourseLiveBinding({
    binding: { path: "bmi270.ax", fallback: 0 },
    snapshot: {
      ...DIAGRAM_DESIGN_TIME_SNAPSHOT,
      bmi270: { ...DIAGRAM_DESIGN_TIME_SNAPSHOT.bmi270, ax: 0.25, hasSample: true },
      connected: true,
    },
    nowMs: 1_000,
    lastRxAtMs: 900,
    staleMs: 2000,
  });
  assert.equal(view.displayValue, 0.25);
  assert.equal(view.health, "live");
});

test("resolveCourseBindingHealthStatus returns static when unbound", () => {
  assert.equal(
    resolveCourseBindingHealthStatus({
      binding: null,
      snapshot: DIAGRAM_DESIGN_TIME_SNAPSHOT,
      nowMs: 0,
      lastRxAtMs: null,
    }),
    "static",
  );
});

test("parsePageV1 accepts dashboard-widget block", () => {
  const page = parsePageV1({
    version: 1,
    id: "binding-test",
    title: "Binding test",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [
      {
        id: "dashboard-widget-1",
        kind: "dashboard-widget",
        placement: { column: 1, row: 1, columnSpan: 3, rowSpan: 2 },
        widgetKind: "text",
        style: { label: "Accel X" },
        binding: COURSE_DASHBOARD_WIDGET_DEFAULT_BINDING,
      },
    ],
  });
  assert.equal(page.blocks[0]?.kind, "dashboard-widget");
});

test("createPageBlock seeds dashboard-widget with default binding", () => {
  const page = parsePageV1({
    version: 1,
    id: "factory-test",
    title: "Factory",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [],
  });
  const block = createPageBlock("dashboard-widget", page);
  assert.equal(block.kind, "dashboard-widget");
  if (block.kind === "dashboard-widget") {
    assert.equal(block.binding?.path, "bmi270.ax");
    assert.equal(block.widgetKind, "text");
  }
});
