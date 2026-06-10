import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";
import {
  dashboardWidgetBlockColorsToStyle,
  patchDashboardWidgetBlockColor,
  stripEmptyDashboardWidgetBlockColors,
} from "../../src/webview/course-studio/schemas/dashboardWidgetBlockColors";
import { resolveDashboardWidgetBlockEffectiveColors } from "../../src/webview/course-studio/runtime/resolveBlockColors";

describe("dashboardWidgetBlockColors", () => {
  it("parsePageV1 accepts dashboard-widget block colors", () => {
    const page = parsePageV1({
      version: 1,
      id: "widget-colors",
      title: "Widgets",
      grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
      blocks: [
        {
          id: "w1",
          kind: "dashboard-widget",
          placement: { column: 1, row: 1, columnSpan: 3, rowSpan: 3 },
          widgetKind: "gauge",
          title: "Live value",
          colors: {
            background: "#112233",
            title: "#ffeeaa",
            headerBackground: "#223344",
          },
        },
      ],
    });
    const block = page.blocks[0];
    assert.equal(block.kind, "dashboard-widget");
    if (block.kind === "dashboard-widget") {
      assert.deepEqual(block.colors, {
        background: "#112233",
        title: "#ffeeaa",
        headerBackground: "#223344",
      });
    }
  });

  it("maps dashboard widget colors to CSS variables", () => {
    assert.deepEqual(
      dashboardWidgetBlockColorsToStyle({
        background: "#112233",
        border: "#445566",
        title: "#fafafa",
        headerBackground: "#27272a",
        headerBorder: "#52525b",
      }),
      {
        "--course-dashboard-widget-bg": "#112233",
        "--course-dashboard-widget-border": "#445566",
        "--course-dashboard-widget-title": "#fafafa",
        "--course-dashboard-widget-header-bg": "#27272a",
        "--course-dashboard-widget-header-border": "#52525b",
      },
    );
  });

  it("patches and strips empty dashboard widget color objects", () => {
    const next = patchDashboardWidgetBlockColor(undefined, "title", "#ffeeaa");
    assert.deepEqual(next, { title: "#ffeeaa" });
    const cleared = patchDashboardWidgetBlockColor(next, "title", undefined);
    assert.equal(stripEmptyDashboardWidgetBlockColors(cleared), undefined);
  });

  it("resolveDashboardWidgetBlockEffectiveColors merges page default and block override", () => {
    const resolved = resolveDashboardWidgetBlockEffectiveColors(
      { title: "#ffffff" },
      { dashboardWidgetColors: { background: "#112233", border: "#334455" } },
      undefined,
    );
    assert.deepEqual(resolved, {
      background: "#112233",
      border: "#334455",
      title: "#ffffff",
    });
  });
});
