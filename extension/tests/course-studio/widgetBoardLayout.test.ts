import assert from "node:assert/strict";
import test from "node:test";

import { resolveWidgetBoardDisplayUnit } from "../../src/webview/course-studio/ui/catalog/widget-board/widgetBoardLayout";

test("resolveWidgetBoardDisplayUnit prefers live binding unit on hero gauge when bound", () => {
  assert.equal(
    resolveWidgetBoardDisplayUnit({
      widget: { kind: "hero-radial-gauge", unit: "km/h" },
      binding: { path: "bmi270.gx", fallback: 0, unit: "hello" },
      liveUnit: "hello",
    }),
    "hello",
  );
  assert.equal(
    resolveWidgetBoardDisplayUnit({
      widget: { kind: "hero-radial-gauge", unit: "km/h" },
      binding: { path: "bmi270.gx", fallback: 0, angularUnit: "rad" },
      liveUnit: "rad/s",
    }),
    "rad/s",
  );
});

test("resolveWidgetBoardDisplayUnit uses widget unit for unbound hero gauge", () => {
  assert.equal(
    resolveWidgetBoardDisplayUnit({
      widget: { kind: "hero-radial-gauge", unit: "km/h" },
      binding: undefined,
      liveUnit: "",
    }),
    "km/h",
  );
});

test("resolveWidgetBoardDisplayUnit prefers live unit on metric bar", () => {
  assert.equal(
    resolveWidgetBoardDisplayUnit({
      widget: { kind: "metric-bar", unit: "" },
      binding: { path: "bmi270.az", fallback: 0, unit: "percent" },
      liveUnit: "percent",
    }),
    "percent",
  );
});
