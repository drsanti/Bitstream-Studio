import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeDashboardInspectorTab } from "../../src/webview/sensor-studio/features/editor/components/inspector/dashboard-inspector-ui-persistence";

test("normalizeDashboardInspectorTab maps legacy four-tab ids to widgets", () => {
  assert.equal(normalizeDashboardInspectorTab("overview"), "widgets");
  assert.equal(normalizeDashboardInspectorTab("widgets"), "widgets");
  assert.equal(normalizeDashboardInspectorTab("controls"), "widgets");
  assert.equal(normalizeDashboardInspectorTab("layout"), "layout");
  assert.equal(normalizeDashboardInspectorTab("unknown"), "widgets");
});
