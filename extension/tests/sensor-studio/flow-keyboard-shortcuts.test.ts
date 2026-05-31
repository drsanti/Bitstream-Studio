import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleFlowKeyboardShortcut } from "../../src/webview/sensor-studio/features/editor/keyboard/flow-keyboard-shortcuts";
import type { FlowKeyboardShortcutContext } from "../../src/webview/sensor-studio/features/editor/keyboard/flow-keyboard-shortcuts";

function makeCtx(overrides: Partial<FlowKeyboardShortcutContext> = {}): FlowKeyboardShortcutContext {
  return {
    flowCanvasGraphRef: { current: null },
    clearNodeSelection: () => {},
    selectAllNodes: () => {},
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
});
