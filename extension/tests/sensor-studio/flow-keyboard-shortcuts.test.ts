import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleFlowKeyboardShortcut } from "../../src/webview/sensor-studio/features/editor/keyboard/flow-keyboard-shortcuts";
import type { FlowKeyboardShortcutContext } from "../../src/webview/sensor-studio/features/editor/keyboard/flow-keyboard-shortcuts";
import { useFlowEditorStore } from "../../src/webview/sensor-studio/features/editor/store/flow-editor.store";

function makeCtx(overrides: Partial<FlowKeyboardShortcutContext> = {}): FlowKeyboardShortcutContext {
  return {
    flowCanvasGraphRef: { current: null },
    clearNodeSelection: () => {},
    selectAllNodes: () => {},
    toggleSelectAllNodes: () => {},
    duplicateSelection: () => {},
    undo: () => {},
    redo: () => {},
    clearNow: () => {},
    runTemplateNow: () => {},
    runSpecificTemplate: () => {},
    onExportFlow: () => {},
    onImportFlowPick: () => {},
    requestFitView: () => {},
    setTemplateId: () => {},
    ...overrides,
  };
}

function keyEvent(init: Partial<KeyboardEventInit> & { key: string }): KeyboardEvent {
  return {
    key: init.key,
    ctrlKey: init.ctrlKey ?? false,
    shiftKey: init.shiftKey ?? false,
    altKey: init.altKey ?? false,
    metaKey: init.metaKey ?? false,
    target: init.target ?? null,
  } as KeyboardEvent;
}

describe("flow-keyboard-shortcuts", () => {
  it("handles Shift+A to toggle add-node menu", () => {
    let toggled = false;
    const ctx = makeCtx({
      flowCanvasGraphRef: {
        current: {
          toggleAddNodeMenu: () => {
            toggled = true;
          },
          isAddNodeMenuOpen: () => false,
          closeAddNodeMenu: () => {},
        },
      },
    });
    const handled = handleFlowKeyboardShortcut(
      keyEvent({ key: "A", shiftKey: true }),
      ctx,
    );
    assert.equal(handled, true);
    assert.equal(toggled, true);
  });

  it("handles A to toggle select all (Blender-style)", () => {
    let toggledSelectAll = false;
    const ctx = makeCtx({
      toggleSelectAllNodes: () => {
        toggledSelectAll = true;
      },
    });
    const handled = handleFlowKeyboardShortcut(keyEvent({ key: "a" }), ctx);
    assert.equal(handled, true);
    assert.equal(toggledSelectAll, true);
  });

  it("handles Ctrl+Shift+S to open Save to library dialog", () => {
    let opened = false;
    const unsub = useFlowEditorStore.subscribe((state) => {
      if (state.saveToLibraryDialogOpen) {
        opened = true;
      }
    });
    useFlowEditorStore.setState({ saveToLibraryDialogOpen: false });
    const handled = handleFlowKeyboardShortcut(
      keyEvent({ key: "S", ctrlKey: true, shiftKey: true }),
      makeCtx(),
    );
    unsub();
    assert.equal(handled, true);
    assert.equal(opened, true);
    useFlowEditorStore.setState({ saveToLibraryDialogOpen: false });
  });

  it("does not treat Ctrl+A as Blender toggle (still select all)", () => {
    let selectAll = false;
    let toggleAll = false;
    const ctx = makeCtx({
      selectAllNodes: () => {
        selectAll = true;
      },
      toggleSelectAllNodes: () => {
        toggleAll = true;
      },
    });
    const handled = handleFlowKeyboardShortcut(
      keyEvent({ key: "a", ctrlKey: true }),
      ctx,
    );
    assert.equal(handled, true);
    assert.equal(selectAll, true);
    assert.equal(toggleAll, false);
  });
});
