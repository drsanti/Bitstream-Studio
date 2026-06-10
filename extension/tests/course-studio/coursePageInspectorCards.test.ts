import { strict as assert } from "node:assert";
import test from "node:test";

import {
  DEFAULT_PAGE_INSPECTOR_CARD_ORDER,
  clampCoursePageInspectorContextSplitRatio,
  DEFAULT_COURSE_PAGE_INSPECTOR_CONTEXT_SPLIT_RATIO,
  mergePageInspectorCardOrder,
} from "../../src/webview/course-studio/maintainer/course-page-inspector-ui-persistence";

test("mergePageInspectorCardOrder keeps stored order and appends new cards", () => {
  const stored = ["document-identity", "add-block", "telemetry-link-health"] as const;
  const visible = [...DEFAULT_PAGE_INSPECTOR_CARD_ORDER];
  const merged = mergePageInspectorCardOrder(stored, visible);
  assert.deepEqual(merged.slice(0, 3), [
    "document-identity",
    "add-block",
    "telemetry-link-health",
  ]);
  assert.equal(merged.includes("presentation-pack"), true);
  assert.equal(merged.includes("element-checklist"), true);
});

test("mergePageInspectorCardOrder drops cards that are not visible", () => {
  const stored = ["presentation-pack", "add-block"] as const;
  const visible = ["add-block", "document-identity"] as const;
  const merged = mergePageInspectorCardOrder(stored, visible);
  assert.deepEqual(merged, ["add-block", "document-identity"]);
});

test("clampCoursePageInspectorContextSplitRatio keeps properties pane usable", () => {
  assert.equal(
    clampCoursePageInspectorContextSplitRatio(DEFAULT_COURSE_PAGE_INSPECTOR_CONTEXT_SPLIT_RATIO),
    DEFAULT_COURSE_PAGE_INSPECTOR_CONTEXT_SPLIT_RATIO,
  );
  assert.equal(clampCoursePageInspectorContextSplitRatio(0.05), 0.22);
  assert.equal(clampCoursePageInspectorContextSplitRatio(0.95), 0.72);
});
