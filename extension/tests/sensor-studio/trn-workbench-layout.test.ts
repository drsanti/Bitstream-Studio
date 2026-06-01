import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createEditorPane, createSplit } from "../../src/webview/ui/workbench/layoutBuilders";
import { collectEditorPanes, findEditorPane } from "../../src/webview/ui/workbench/layoutTraversal";
import { validateLayoutTree } from "../../src/webview/ui/workbench/layoutValidateCore";
import {
  collapseEditorPane,
  expandEditorPane,
  findEditorPaneId,
  isCollapsedEditor,
} from "../../src/webview/ui/workbench/utils";
import {
  canRedoLayout,
  canUndoLayout,
  clearLayoutHistory,
  pushLayoutHistory,
  redoLayout,
  undoLayout,
} from "../../src/webview/ui/workbench/layout-history";
import { DEFAULT_STUDIO_WORKBENCH_LAYOUT } from "../../src/webview/sensor-studio/features/editor/workbench/default-studio-workbench-layout";
import {
  toggleStudioPaneCollapseByEditorType,
  validateStudioWorkbenchLayout,
} from "../../src/webview/sensor-studio/features/editor/workbench/validate-studio-workbench-layout";

describe("TRN workbench layout", () => {
  it("validates studio layout and drops unknown editor types", () => {
    const bad = structuredClone(DEFAULT_STUDIO_WORKBENCH_LAYOUT);
    const pane = collectEditorPanes(bad).find((n) => n.editorType === "library");
    assert.ok(pane);
    pane!.editorType = "unknown-pane";

    const fixed = validateStudioWorkbenchLayout(bad);
    const replaced = collectEditorPanes(fixed).find((n) => n.id === pane!.id);
    assert.ok(replaced);
    assert.equal(replaced!.editorType, "flow");
  });

  it("collapses and expands a pane by editor type", () => {
    let layout = DEFAULT_STUDIO_WORKBENCH_LAYOUT;
    layout = toggleStudioPaneCollapseByEditorType(layout, "library");
    const libraryId = findEditorPaneId(layout, "library");
    assert.ok(libraryId);
    const collapsed = findEditorPane(layout, libraryId!);
    assert.ok(collapsed);
    assert.equal(isCollapsedEditor(collapsed!), true);

    layout = toggleStudioPaneCollapseByEditorType(layout, "library");
    const expanded = findEditorPane(layout, libraryId!);
    assert.equal(isCollapsedEditor(expanded!), false);
  });

  it("supports tab groups in persisted layouts", () => {
    const tabsLayout = createSplit(
      createEditorPane("flow"),
      {
        id: "tabs-1",
        type: "tabs",
        activeIndex: 0,
        panes: [createEditorPane("inspector"), createEditorPane("library")],
      },
      "horizontal",
      0.7,
    );

    const parsed = validateLayoutTree(tabsLayout, {
      fallback: DEFAULT_STUDIO_WORKBENCH_LAYOUT,
      knownEditorTypes: new Set(["library", "assets", "flow", "inspector"]),
      fallbackEditorType: "flow",
    });

    assert.equal(parsed.type, "split");
  });

  it("collapseEditorPane marks pane collapsed with edge metadata", () => {
    const pane = createEditorPane("inspector");
    const layout = createSplit(createEditorPane("flow"), pane, "horizontal", 0.75);
    const collapsed = collapseEditorPane(layout, pane.id);
    const after = findEditorPane(collapsed, pane.id);
    assert.equal(after?.collapsed, true);
    assert.ok(after?.collapseEdge);
  });

  it("expandEditorPane restores a collapsed pane", () => {
    const pane = createEditorPane("inspector");
    const layout = createSplit(createEditorPane("flow"), pane, "horizontal", 0.75);
    const collapsed = collapseEditorPane(layout, pane.id);
    const expanded = expandEditorPane(collapsed, pane.id);
    const after = findEditorPane(expanded, pane.id);
    assert.equal(after?.collapsed, undefined);
  });

  it("layout history supports undo and redo", () => {
    clearLayoutHistory();
    const base = DEFAULT_STUDIO_WORKBENCH_LAYOUT;
    const changed = collapseEditorPane(
      base,
      findEditorPaneId(base, "library")!,
    );
    pushLayoutHistory(base);
    const undone = undoLayout(changed);
    assert.ok(undone);
    assert.equal(isCollapsedEditor(findEditorPane(undone!, findEditorPaneId(undone!, "library")!)!), false);
    assert.equal(canUndoLayout(), false);
    assert.equal(canRedoLayout(), true);
    const redone = redoLayout(undone!);
    assert.ok(redone);
    assert.equal(
      isCollapsedEditor(findEditorPane(redone!, findEditorPaneId(redone!, "library")!)!),
      true,
    );
    clearLayoutHistory();
  });
});
