import assert from "node:assert/strict";
import test from "node:test";

import { createWidgetBoardEntry } from "../../src/webview/course-studio/maintainer/widget-board/widgetBoardEditorOps";
import {
  WIDGET_BOARD_BOOLEAN_WIDGET_KINDS,
  WIDGET_BOARD_SCALAR_WIDGET_KINDS,
  WIDGET_BOARD_WIDGET_MIN_SPAN,
  createEvCompactWidgetBoardWidgets,
  widgetBoardEntrySchema,
} from "../../src/webview/course-studio/schemas/widgetBoard.v1";
import { resolveWidgetBoardBooleanActive } from "../../src/webview/course-studio/ui/catalog/widget-board/widgetBoardActiveState";
import { resolveWidgetBoardStatusToneColors } from "../../src/webview/course-studio/ui/catalog/widget-board/widgetBoardStatusTone";
import { buildDefaultWidgetBoardEntry } from "../../src/webview/course-studio/ui/catalog/widget-board/widgetBoardWidgetDefaults";
import { resolveWidgetBoardDisplayUnit } from "../../src/webview/course-studio/ui/catalog/widget-board/widgetBoardLayout";

const NEW_KINDS = [
  "numeric-readout",
  "vertical-bar",
  "status-pill",
  "led-indicator",
] as const;

test("widget board schema accepts all six widget kinds", () => {
  const widgets = createEvCompactWidgetBoardWidgets();
  for (const kind of NEW_KINDS) {
    const entry = createWidgetBoardEntry(kind, widgets, 6);
    const parsed = widgetBoardEntrySchema.parse(entry);
    assert.equal(parsed.kind, kind);
  }
});

test("buildDefaultWidgetBoardEntry sets expected min spans", () => {
  for (const kind of Object.keys(WIDGET_BOARD_WIDGET_MIN_SPAN) as Array<
    keyof typeof WIDGET_BOARD_WIDGET_MIN_SPAN
  >) {
    const entry = buildDefaultWidgetBoardEntry(kind, kind, {
      column: 1,
      row: 1,
      columnSpan: WIDGET_BOARD_WIDGET_MIN_SPAN[kind].columnSpan,
      rowSpan: WIDGET_BOARD_WIDGET_MIN_SPAN[kind].rowSpan,
    });
    assert.equal(entry.kind, kind);
  }
});

test("resolveWidgetBoardDisplayUnit prefers live unit for scalar widgets", () => {
  const unit = resolveWidgetBoardDisplayUnit({
    widget: { kind: "numeric-readout", unit: "demo" },
    binding: { path: "sensor/demo", unit: "bind" },
    liveUnit: "live",
  });
  assert.equal(unit, "live");
});

test("resolveWidgetBoardBooleanActive uses demo when unbound", () => {
  const active = resolveWidgetBoardBooleanActive({
    binding: undefined,
    rawValue: null,
    displayValue: null,
    condition: { compareOp: ">=", compareValue: 0.5 },
    demoActive: true,
    hasLiveSample: false,
  });
  assert.equal(active, true);
});

test("resolveWidgetBoardBooleanActive evaluates compare when bound", () => {
  const active = resolveWidgetBoardBooleanActive({
    binding: { path: "sensor/demo" },
    rawValue: 0.8,
    displayValue: 0.8,
    condition: { compareOp: ">=", compareValue: 0.5 },
    demoActive: false,
    hasLiveSample: true,
  });
  assert.equal(active, true);
});

test("resolveWidgetBoardStatusToneColors uses custom colors", () => {
  const colors = resolveWidgetBoardStatusToneColors({
    tone: "custom",
    backgroundColor: "#111111",
    textColor: "#eeeeee",
    borderColor: "#333333",
  });
  assert.equal(colors.background, "#111111");
  assert.equal(colors.text, "#eeeeee");
  assert.equal(colors.border, "#333333");
});

test("scalar and boolean kind sets partition widget kinds", () => {
  for (const kind of NEW_KINDS) {
    if (kind === "status-pill" || kind === "led-indicator") {
      assert.equal(WIDGET_BOARD_BOOLEAN_WIDGET_KINDS.has(kind), true);
      assert.equal(WIDGET_BOARD_SCALAR_WIDGET_KINDS.has(kind), false);
    } else {
      assert.equal(WIDGET_BOARD_SCALAR_WIDGET_KINDS.has(kind), true);
      assert.equal(WIDGET_BOARD_BOOLEAN_WIDGET_KINDS.has(kind), false);
    }
  }
});
