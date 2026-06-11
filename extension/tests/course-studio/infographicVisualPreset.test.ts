import assert from "node:assert/strict";
import test from "node:test";

import {
  coerceInfographicVisualPreset,
  isActiveInfographicPreset,
  readInfographicSkinConfig,
  resolveInfographicValueMode,
  suggestInfographicPresetFromPath,
} from "../../src/webview/course-studio/schemas/infographicVisualPreset.v1";
import { widgetBoardEntrySchema } from "../../src/webview/course-studio/schemas/widgetBoard.v1";

test("suggestInfographicPresetFromPath maps sensor paths", () => {
  assert.equal(suggestInfographicPresetFromPath("sht40.temp"), "thermometer-mercury");
  assert.equal(suggestInfographicPresetFromPath("sht40.rh"), "droplet-fill");
  assert.equal(suggestInfographicPresetFromPath("dps368.pressureHpa"), "manometer-column");
  assert.equal(suggestInfographicPresetFromPath("bmm350.headingDeg"), "compass-rose");
});

test("resolveInfographicValueMode distinguishes ratio angle numeric", () => {
  assert.equal(resolveInfographicValueMode("thermometer-mercury"), "ratio");
  assert.equal(resolveInfographicValueMode("compass-rose"), "angle");
  assert.equal(resolveInfographicValueMode("seven-segment"), "numeric");
});

test("widget board numeric readout defaults visualPreset to abstract", () => {
  const parsed = widgetBoardEntrySchema.parse({
    id: "t1",
    kind: "numeric-readout",
    placement: { column: 1, row: 1, columnSpan: 2, rowSpan: 2 },
    label: "Temp",
  });
  assert.equal(parsed.kind, "numeric-readout");
  if (parsed.kind === "numeric-readout") {
    assert.equal(parsed.visualPreset, "abstract");
    assert.equal(parsed.readoutLayout, "stacked");
  }
});

test("widget board scalar entry defaults readoutLayout to stacked", () => {
  const parsed = widgetBoardEntrySchema.parse({
    id: "t2",
    kind: "metric-bar",
    placement: { column: 1, row: 1, columnSpan: 2, rowSpan: 2 },
    label: "Metric",
  });
  if (parsed.kind === "metric-bar") {
    assert.equal(parsed.readoutLayout, "stacked");
    assert.equal(parsed.readoutInlineAlign, "start");
    assert.equal(parsed.readoutOrder, "label-first");
    assert.equal(parsed.readoutGapPx, 8);
    assert.equal(parsed.tileContentH, "center");
    assert.equal(parsed.tileContentV, "center");
  }
});

test("widget board status pill defaults layout and pill fields", () => {
  const parsed = widgetBoardEntrySchema.parse({
    id: "sp1",
    kind: "status-pill",
    placement: { column: 1, row: 1, columnSpan: 3, rowSpan: 1 },
    label: "Status",
  });
  if (parsed.kind === "status-pill") {
    assert.equal(parsed.readoutLayout, "stacked");
    assert.equal(parsed.showStatusPill, true);
    assert.equal(parsed.pillSize, "md");
  }
});

test("widget board hero gauge defaults tile layout fields", () => {
  const parsed = widgetBoardEntrySchema.parse({
    id: "hg1",
    kind: "hero-radial-gauge",
    placement: { column: 1, row: 1, columnSpan: 3, rowSpan: 3 },
    label: "Speed",
  });
  if (parsed.kind === "hero-radial-gauge") {
    assert.equal(parsed.showLabel, true);
    assert.equal(parsed.labelPosition, "top");
    assert.equal(parsed.tileContentH, "center");
  }
});

test("readInfographicSkinConfig clamps skin fields", () => {
  const config = readInfographicSkinConfig({
    fillSmoothingMs: 9000,
    segmentCount: 12,
    tubeWidthPercent: 4,
  });
  assert.equal(config.fillSmoothingMs, 5000);
  assert.equal(config.segmentCount, 8);
  assert.equal(config.tubeWidthPercent, 10);
});

test("isActiveInfographicPreset excludes abstract", () => {
  assert.equal(isActiveInfographicPreset("abstract"), false);
  assert.equal(isActiveInfographicPreset(coerceInfographicVisualPreset("battery-segmented")), true);
});
