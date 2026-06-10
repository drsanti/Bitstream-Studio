import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveWidgetBoardThemeTokens,
  widgetBoardThemeTokensToCssProperties,
  WIDGET_BOARD_THEME_PRESETS,
} from "../../src/webview/course-studio/schemas/widgetBoardTheme.v1";
import { createEvCompactWidgetBoardWidgets, widgetBoardEntrySchema } from "../../src/webview/course-studio/schemas/widgetBoard.v1";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";

test("widget board theme presets expose five named palettes", () => {
  assert.equal(Object.keys(WIDGET_BOARD_THEME_PRESETS).length, 5);
  assert.equal(WIDGET_BOARD_THEME_PRESETS["sci-fi"].gradientVia, "#42e8ff");
});

test("resolveWidgetBoardThemeTokens merges overrides onto preset", () => {
  const tokens = resolveWidgetBoardThemeTokens({
    presetId: "ev-compact",
    overrides: { value: "#ffffff" },
  });
  assert.equal(tokens.value, "#ffffff");
  assert.equal(tokens.gaugeArcFrom, WIDGET_BOARD_THEME_PRESETS["ev-compact"].gaugeArcFrom);
});

test("widgetBoardThemeTokensToCssProperties maps semantic tokens to CSS variables", () => {
  const style = widgetBoardThemeTokensToCssProperties(
    resolveWidgetBoardThemeTokens({ presetId: "telemetry-cyan" }),
  );
  assert.equal(style["--course-wb-shell-bg"], WIDGET_BOARD_THEME_PRESETS["telemetry-cyan"].shellBg);
  assert.equal(style["--course-wb-stale-opacity"], "0.55");
});

test("EV compact widget board template fits inner six-column grid", () => {
  for (const widget of createEvCompactWidgetBoardWidgets()) {
    const parsed = widgetBoardEntrySchema.parse(widget);
    assert.ok(parsed.placement.column + parsed.placement.columnSpan - 1 <= 6);
  }
});

test("parsePageV1 accepts widget-board blocks", () => {
  const page = parsePageV1({
    version: 1,
    id: "widget-demo",
    title: "Widget demo",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [
      {
        id: "wb-1",
        kind: "widget-board",
        placement: { column: 1, row: 1, columnSpan: 8, rowSpan: 5 },
        appearance: { themePresetId: "sci-fi", showMetaLine: true, metaLine: "Sci-fi demo" },
        grid: { columns: 6, rowHeightPx: 40, gapPx: 8, paddingPx: 16 },
        widgets: createEvCompactWidgetBoardWidgets(),
      },
    ],
  });
  assert.equal(page.blocks[0]?.kind, "widget-board");
  if (page.blocks[0]?.kind === "widget-board") {
    assert.equal(page.blocks[0].appearance.themePresetId, "sci-fi");
    assert.equal(page.blocks[0].widgets.length, 3);
  }
});
