import assert from "node:assert/strict";
import { test } from "node:test";
import { createEditorPane } from "../../src/webview/ui/workbench/layoutBuilders";
import { collectEditorPanes } from "../../src/webview/ui/workbench/layoutTraversal";
import { createSplit } from "../../src/webview/ui/workbench/layoutBuilders";
import {
  dedupeStudioInspectorEditorPanes,
  ensureStudioInspectorPinnedPane,
  hasStudioInspectorPinnedPane,
  normalizeStudioInspectorWorkbenchLayout,
  removeStudioInspectorPinnedPane,
  stripStudioInspectorPinnedPaneFromLayout,
} from "../../src/webview/sensor-studio/features/editor/workbench/studio-inspector-pinned-pane-layout";

const INSPECTOR_ONLY = createEditorPane("inspector", { id: "pane-inspector" });

test("ensureStudioInspectorPinnedPane adds inspector-pinned above inspector", () => {
  const next = ensureStudioInspectorPinnedPane(INSPECTOR_ONLY);
  assert.equal(hasStudioInspectorPinnedPane(next), true);
  const types = collectEditorPanes(next).map((pane) => pane.editorType);
  assert.deepEqual(types, ["inspector-pinned", "inspector"]);
});

test("removeStudioInspectorPinnedPane restores single inspector", () => {
  const split = ensureStudioInspectorPinnedPane(INSPECTOR_ONLY);
  const next = removeStudioInspectorPinnedPane(split);
  assert.equal(hasStudioInspectorPinnedPane(next), false);
  assert.equal(collectEditorPanes(next).length, 1);
  assert.equal(collectEditorPanes(next)[0]?.editorType, "inspector");
});

test("stripStudioInspectorPinnedPaneFromLayout is idempotent", () => {
  const split = ensureStudioInspectorPinnedPane(INSPECTOR_ONLY);
  const stripped = stripStudioInspectorPinnedPaneFromLayout(split);
  assert.equal(hasStudioInspectorPinnedPane(stripped), false);
  assert.equal(stripStudioInspectorPinnedPaneFromLayout(stripped), stripped);
});

test("dedupeStudioInspectorEditorPanes keeps canonical inspector only", () => {
  const duplicate = createSplit(
    createEditorPane("inspector", { id: "pane-inspector" }),
    createEditorPane("inspector", { id: "extra-inspector" }),
    "vertical",
    0.5,
    "dup-root",
  );
  const next = dedupeStudioInspectorEditorPanes(duplicate);
  assert.equal(collectEditorPanes(next).length, 1);
  assert.equal(collectEditorPanes(next)[0]?.id, "pane-inspector");
});

test("normalizeStudioInspectorWorkbenchLayout removes pinned pane when not needed", () => {
  const split = ensureStudioInspectorPinnedPane(INSPECTOR_ONLY);
  const next = normalizeStudioInspectorWorkbenchLayout(split, false);
  assert.equal(hasStudioInspectorPinnedPane(next), false);
  assert.equal(collectEditorPanes(next).length, 1);
});
