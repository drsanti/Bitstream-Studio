import { toggleQuickActionPalette } from "./quickActionToggle.js";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function isQuickActionShortcut(event: KeyboardEvent): boolean {
  if (event.altKey) {
    return false;
  }
  const mod = event.ctrlKey || event.metaKey;
  if (!mod) {
    return false;
  }
  return event.key === "/" || event.code === "Slash";
}

function onQuickActionKeyDown(event: KeyboardEvent): void {
  if (!isQuickActionShortcut(event) || isEditableTarget(event.target)) {
    return;
  }
  event.preventDefault();
  event.stopImmediatePropagation();
  toggleQuickActionPalette();
}

let installed = false;

/**
 * Ctrl+/ (Cmd+/ on Mac) for Quick Actions — browser dev and VS Code webview.
 * Capture phase; VS Code does not forward this chord to package.json when the
 * iframe handles it, so this is the primary path inside the panel.
 */
export function installWebviewQuickActionShortcut(): void {
  if (installed || typeof document === "undefined") {
    return;
  }
  installed = true;
  document.addEventListener("keydown", onQuickActionKeyDown, true);
}

export function uninstallWebviewQuickActionShortcut(): void {
  if (!installed || typeof document === "undefined") {
    return;
  }
  installed = false;
  document.removeEventListener("keydown", onQuickActionKeyDown, true);
}
