type KonvaEditorShortcutHandlers = {
  group?: () => void;
  ungroup?: () => void;
};

let handlers: KonvaEditorShortcutHandlers = {};
let installed = false;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function onKonvaGroupShortcutKeyDown(event: KeyboardEvent): void {
  if (isEditableTarget(event.target)) {
    return;
  }
  const mod = event.ctrlKey || event.metaKey;
  if (!mod || event.altKey) {
    return;
  }
  if (event.code !== "KeyG") {
    return;
  }

  if (event.shiftKey) {
    if (handlers.ungroup == null) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    handlers.ungroup();
    return;
  }

  if (handlers.group == null) {
    return;
  }
  event.preventDefault();
  event.stopImmediatePropagation();
  handlers.group();
}

/** Register Konva editor group/ungroup handlers (CourseKonvaEditor mounts these). */
export function registerKonvaEditorShortcutHandlers(next: KonvaEditorShortcutHandlers): void {
  handlers = next;
}

/**
 * Ctrl+G / Ctrl+Shift+G for Konva group/ungroup — capture phase so VS Code does not
 * steal Ctrl+G (Go to Line) before the canvas handler runs.
 */
export function installKonvaEditorGroupShortcuts(): void {
  if (installed || typeof document === "undefined") {
    return;
  }
  installed = true;
  document.addEventListener("keydown", onKonvaGroupShortcutKeyDown, true);
}

export function uninstallKonvaEditorGroupShortcuts(): void {
  if (!installed || typeof document === "undefined") {
    return;
  }
  installed = false;
  document.removeEventListener("keydown", onKonvaGroupShortcutKeyDown, true);
}
