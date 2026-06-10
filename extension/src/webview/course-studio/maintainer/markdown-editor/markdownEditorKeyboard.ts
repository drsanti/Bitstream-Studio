import type { KeyboardEvent } from "react";
import type { MarkdownToolbarActionId } from "./markdownEditorActions";

export type MarkdownEditorKeyboardHandlers = {
  onToolbarAction: (id: MarkdownToolbarActionId) => void;
  onFindOpen: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

/** Returns true when the event was handled (caller should rely on preventDefault inside). */
export function handleMarkdownEditorKeyDown(
  event: KeyboardEvent,
  handlers: MarkdownEditorKeyboardHandlers,
): boolean {
  const mod = event.ctrlKey || event.metaKey;
  if (!mod) {
    return false;
  }

  const key = event.key.toLowerCase();

  if (key === "b") {
    event.preventDefault();
    handlers.onToolbarAction("bold");
    return true;
  }
  if (key === "i") {
    event.preventDefault();
    handlers.onToolbarAction("italic");
    return true;
  }
  if (key === "k") {
    event.preventDefault();
    handlers.onToolbarAction("link");
    return true;
  }
  if (key === "f") {
    event.preventDefault();
    handlers.onFindOpen();
    return true;
  }
  if (key === "z" && !event.shiftKey) {
    if (!handlers.canUndo) {
      return false;
    }
    event.preventDefault();
    handlers.onUndo();
    return true;
  }
  if (key === "z" && event.shiftKey) {
    if (!handlers.canRedo) {
      return false;
    }
    event.preventDefault();
    handlers.onRedo();
    return true;
  }
  if (key === "y") {
    if (!handlers.canRedo) {
      return false;
    }
    event.preventDefault();
    handlers.onRedo();
    return true;
  }

  return false;
}
