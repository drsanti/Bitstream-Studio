import { useEffect } from "react";

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el?.closest("input, textarea, select, [contenteditable=true]"));
}

export type WorkbenchKeyboardShortcutHandlers = {
  onOpenCommandPalette: () => void;
  collapseActivePane: () => void;
  expandPaneTarget: () => void;
  cycleCollapsedRailFocus: (direction: 1 | -1) => void;
  undoLayoutChange: () => void;
  redoLayoutChange: () => void;
  duplicateActivePane: () => void;
  togglePaneByEditorType?: (editorType: string) => void;
};

export function useWorkbenchKeyboardShortcuts(
  handlers: WorkbenchKeyboardShortcutHandlers,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      const mod = event.ctrlKey || event.metaKey;

      if (mod && event.shiftKey && !event.altKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        handlers.onOpenCommandPalette();
        return;
      }

      if (mod && event.shiftKey && !event.altKey) {
        if (event.key === "[" || event.key === "{") {
          event.preventDefault();
          handlers.cycleCollapsedRailFocus(-1);
          return;
        }
        if (event.key === "]" || event.key === "}") {
          event.preventDefault();
          handlers.cycleCollapsedRailFocus(1);
          return;
        }
        const shiftKey = event.key.toLowerCase();
        if (shiftKey === "c") {
          event.preventDefault();
          handlers.collapseActivePane();
          return;
        }
        if (shiftKey === "e") {
          event.preventDefault();
          handlers.expandPaneTarget();
          return;
        }
        if (shiftKey === "d") {
          event.preventDefault();
          handlers.duplicateActivePane();
          return;
        }
      }

      if (mod && event.altKey && !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        handlers.undoLayoutChange();
        return;
      }

      if (mod && event.altKey && event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        handlers.redoLayoutChange();
        return;
      }

      if (event.altKey && !mod && !event.shiftKey && !event.repeat) {
        if (event.code === "KeyP") {
          event.preventDefault();
          handlers.togglePaneByEditorType?.("library");
          return;
        }
        if (event.code === "KeyI") {
          event.preventDefault();
          handlers.togglePaneByEditorType?.("inspector");
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, handlers]);
}
