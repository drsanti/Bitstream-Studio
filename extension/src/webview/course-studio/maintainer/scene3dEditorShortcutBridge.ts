type Scene3dEditorShortcutHandlers = {
  group?: () => void;
  openParentMenu?: () => void;
  openClearParentMenu?: () => void;
};

let handlers: Scene3dEditorShortcutHandlers = {};
let installed = false;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function onScene3dEditorShortcutKeyDown(event: KeyboardEvent): void {
  if (isEditableTarget(event.target)) {
    return;
  }

  const mod = event.ctrlKey || event.metaKey;

  // Alt+P — Clear Parent (Blender)
  if (
    event.altKey &&
    !mod &&
    !event.shiftKey &&
    event.code === "KeyP" &&
    handlers.openClearParentMenu != null
  ) {
    event.preventDefault();
    event.stopImmediatePropagation();
    handlers.openClearParentMenu();
    return;
  }

  if (!mod || event.altKey) {
    return;
  }

  if (event.code === "KeyG" && !event.shiftKey && handlers.group != null) {
    event.preventDefault();
    event.stopImmediatePropagation();
    handlers.group();
    return;
  }

  if (event.code === "KeyP" && handlers.openParentMenu != null) {
    event.preventDefault();
    event.stopImmediatePropagation();
    handlers.openParentMenu();
    return;
  }
}

export function registerScene3dEditorShortcutHandlers(next: Scene3dEditorShortcutHandlers): void {
  handlers = next;
}

/**
 * Ctrl+G / Ctrl+P / Alt+P for 3D Scene hierarchy — document capture phase so the
 * browser print dialog and host shortcuts do not run first.
 */
export function installScene3dEditorShortcuts(): void {
  if (installed || typeof document === "undefined") {
    return;
  }
  installed = true;
  document.addEventListener("keydown", onScene3dEditorShortcutKeyDown, true);
}

export function uninstallScene3dEditorShortcuts(): void {
  if (!installed || typeof document === "undefined") {
    return;
  }
  installed = false;
  handlers = {};
  document.removeEventListener("keydown", onScene3dEditorShortcutKeyDown, true);
}
