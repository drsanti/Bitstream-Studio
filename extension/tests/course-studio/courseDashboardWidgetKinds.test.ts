import assert from "node:assert/strict";
import test from "node:test";

import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";
import {
  defaultCourseDashboardWidgetStyle,
  ensureCourseDashboardWidgetPlacement,
  resolveCourseDashboardStatusActive,
} from "../../src/webview/course-studio/schemas/courseDashboardWidgetKinds";

test("parsePageV1 accepts gauge, bar, and status dashboard widgets", () => {
  const page = parsePageV1({
    version: 1,
    id: "widgets",
    title: "Widgets",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [
      {
        id: "g",
        kind: "dashboard-widget",
        placement: { column: 1, row: 1, columnSpan: 3, rowSpan: 3 },
        widgetKind: "gauge",
        style: { min: 0, max: 200, unit: "°/s" },
        binding: { path: "bmi270.gyrMag", fallback: 0 },
      },
      {
        id: "b",
        kind: "dashboard-widget",
        placement: { column: 4, row: 1, columnSpan: 3, rowSpan: 3 },
        widgetKind: "bar",
        style: { min: 0, max: 2, unit: "g", orientation: "horizontal" },
        binding: { path: "bmi270.accMag", fallback: 0 },
      },
      {
        id: "s",
        kind: "dashboard-widget",
        placement: { column: 7, row: 1, columnSpan: 3, rowSpan: 1 },
        widgetKind: "status",
        style: { label: "Accel valid", onLabel: "Valid", offLabel: "Invalid" },
        binding: { path: "bmi270.accValid", fallback: 0 },
      },
    ],
  });
  assert.equal(page.blocks.length, 3);
  assert.equal(page.blocks[0]?.kind === "dashboard-widget" && page.blocks[0].widgetKind, "gauge");
  assert.equal(page.blocks[1]?.kind === "dashboard-widget" && page.blocks[1].widgetKind, "bar");
  assert.equal(page.blocks[2]?.kind === "dashboard-widget" && page.blocks[2].widgetKind, "status");
});

test("ensureCourseDashboardWidgetPlacement expands span for gauge", () => {
  const next = ensureCourseDashboardWidgetPlacement(
    { column: 1, row: 1, columnSpan: 2, rowSpan: 2 },
    "gauge",
  );
  assert.equal(next.columnSpan, 3);
  assert.equal(next.rowSpan, 3);
});

test("resolveCourseDashboardStatusActive handles boolean and numeric bindings", () => {
  assert.equal(
    resolveCourseDashboardStatusActive({
      rawValue: true,
      displayValue: 1,
      threshold: 0.5,
    }),
    true,
  );
  assert.equal(
    resolveCourseDashboardStatusActive({
      rawValue: 0.2,
      displayValue: 0.2,
      threshold: 0.5,
    }),
    false,
  );
  assert.equal(
    resolveCourseDashboardStatusActive({
      rawValue: 0.8,
      displayValue: 0.8,
      threshold: 0.5,
    }),
    true,
  );
});

test("defaultCourseDashboardWidgetStyle returns gauge defaults", () => {
  const style = defaultCourseDashboardWidgetStyle("gauge");
  assert.equal(style.min, 0);
  assert.equal(style.max, 100);
  assert.equal(style.arcPreset, "automotive270");
  assert.equal(style.showDigitalValue, true);
  assert.equal(style.showUnit, true);
  assert.equal(style.zonePreset, "traffic");
  assert.ok(Array.isArray(style.zones));
  assert.equal((style.zones as unknown[]).length, 3);
});
