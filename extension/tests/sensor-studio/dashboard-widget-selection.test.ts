import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clientRectFromPoints,
  dashboardPrimaryHighlightedWidgetId,
  dashboardWidgetSelectionAfterClick,
  dashboardWidgetSelectionAfterMarquee,
  rectsIntersect,
} from "../../src/webview/sensor-studio/core/dashboard/dashboard-widget-selection";

describe("dashboard-widget-selection", () => {
  it("primary is last selected id", () => {
    assert.equal(dashboardPrimaryHighlightedWidgetId([]), null);
    assert.equal(dashboardPrimaryHighlightedWidgetId(["a"]), "a");
    assert.equal(dashboardPrimaryHighlightedWidgetId(["a", "b"]), "b");
  });

  it("plain click replaces selection", () => {
    assert.deepEqual(
      dashboardWidgetSelectionAfterClick(["a", "b"], "c", {}),
      ["c"],
    );
  });

  it("ctrl click toggles", () => {
    assert.deepEqual(
      dashboardWidgetSelectionAfterClick(["a"], "b", { shiftKey: false, ctrlKey: true, metaKey: false }),
      ["a", "b"],
    );
    assert.deepEqual(
      dashboardWidgetSelectionAfterClick(["a", "b"], "a", { shiftKey: false, ctrlKey: true, metaKey: false }),
      ["b"],
    );
  });

  it("shift click adds without removing", () => {
    assert.deepEqual(
      dashboardWidgetSelectionAfterClick(["a"], "b", { shiftKey: true, ctrlKey: false, metaKey: false }),
      ["a", "b"],
    );
    assert.deepEqual(
      dashboardWidgetSelectionAfterClick(["a", "b"], "a", { shiftKey: true, ctrlKey: false, metaKey: false }),
      ["a", "b"],
    );
  });

  it("marquee replaces unless additive", () => {
    assert.deepEqual(
      dashboardWidgetSelectionAfterMarquee(["a"], ["b", "c"], {}),
      ["b", "c"],
    );
    assert.deepEqual(
      dashboardWidgetSelectionAfterMarquee(
        ["a"],
        ["b"],
        { shiftKey: true, ctrlKey: false, metaKey: false },
      ),
      ["a", "b"],
    );
    assert.deepEqual(
      dashboardWidgetSelectionAfterMarquee(["a"], [], {}),
      [],
    );
    assert.deepEqual(
      dashboardWidgetSelectionAfterMarquee(
        ["a"],
        [],
        { shiftKey: true, ctrlKey: false, metaKey: false },
      ),
      ["a"],
    );
  });

  it("clientRectFromPoints normalizes corners", () => {
    const rect = clientRectFromPoints(10, 20, 30, 50);
    assert.equal(rect.left, 10);
    assert.equal(rect.top, 20);
    assert.equal(rect.right, 30);
    assert.equal(rect.bottom, 50);
    assert.equal(rect.right - rect.left, 20);
    assert.equal(rect.bottom - rect.top, 30);
  });

  it("rectsIntersect detects overlap", () => {
    const a = { left: 0, top: 0, right: 10, bottom: 10 };
    const b = { left: 5, top: 5, right: 15, bottom: 15 };
    const c = { left: 20, top: 20, right: 30, bottom: 30 };
    assert.equal(rectsIntersect(a, b), true);
    assert.equal(rectsIntersect(a, c), false);
  });
});
