import assert from "node:assert/strict";
import { test } from "node:test";
import { createEditorPane, createSplit } from "../../src/webview/ui/workbench/layoutBuilders";
import { collectEditorPanes } from "../../src/webview/ui/workbench/layoutTraversal";
import {
  migrateStudioWorkbenchLayoutToSingleFlow,
  studioWorkbenchMigrateEditorType,
} from "../../src/webview/sensor-studio/features/editor/workbench/migrate-studio-workbench-layout";
import { STUDIO_TWIN_FOCUS_LAYOUT } from "../../src/webview/sensor-studio/features/editor/workbench/studio-workbench-layout-constants";

test("studioWorkbenchMigrateEditorType maps legacy scoped flow panes to flow", () => {
  assert.equal(studioWorkbenchMigrateEditorType("flow-dashboard"), "flow");
  assert.equal(studioWorkbenchMigrateEditorType("flow-stage"), "flow");
  assert.equal(studioWorkbenchMigrateEditorType("flow"), "flow");
});

test("migrateStudioWorkbenchLayoutToSingleFlow replaces legacy twin desk", () => {
  const legacyTwin = createSplit(
    createEditorPane("dashboard", { id: "dash" }),
    createSplit(
      createEditorPane("stage", { id: "stage" }),
      createEditorPane("flow-stage", { id: "flow-stage" }),
      "vertical",
      0.74,
    ),
    "horizontal",
    0.5,
  );
  const migrated = migrateStudioWorkbenchLayoutToSingleFlow(legacyTwin);
  const types = new Set(collectEditorPanes(migrated).map((pane) => pane.editorType));
  assert.equal(types.has("flow-dashboard"), false);
  assert.equal(types.has("flow-stage"), false);
  assert.equal(types.has("flow"), true);
  assert.equal(collectEditorPanes(migrated).filter((pane) => pane.editorType === "flow").length, 1);
});

test("validate twin-focus preset has a single flow pane", () => {
  const types = collectEditorPanes(STUDIO_TWIN_FOCUS_LAYOUT).map((pane) => pane.editorType);
  assert.equal(types.filter((type) => type === "flow").length, 1);
  assert.equal(types.includes("dashboard"), true);
  assert.equal(types.includes("stage"), true);
  assert.equal(types.includes("flow-dashboard"), false);
  assert.equal(types.includes("flow-stage"), false);
});
