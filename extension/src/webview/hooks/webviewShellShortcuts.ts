import { navigateToDevLauncher } from "../state/webviewDevNavigation";
import { getWebviewEntryStore } from "../state/webviewEntry.store";
import { isBrowserShellEnvironment } from "../state/webviewShellUrl";

/** App switch digits (use `event.code` — `event.key` is shifted symbols with Ctrl+Shift). */
const APP_SWITCH_CODES = new Set([
  "Digit1",
  "Digit2",
  "Digit3",
  "Numpad1",
  "Numpad2",
  "Numpad3",
]);

/** Launcher home: H and backquote (`). Ctrl+Shift+0 is not registered (Chrome zoom reset). */
const LAUNCHER_CODES = new Set(["KeyH", "Backquote"]);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function hasShellModifiers(event: KeyboardEvent): boolean {
  return event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey;
}

function isLauncherShortcut(event: KeyboardEvent): boolean {
  return hasShellModifiers(event) && LAUNCHER_CODES.has(event.code);
}

function isAppSwitchShortcut(event: KeyboardEvent): boolean {
  return hasShellModifiers(event) && APP_SWITCH_CODES.has(event.code);
}

function runShellShortcut(code: string): void {
  const store = getWebviewEntryStore();
  switch (code) {
    case "KeyH":
    case "Backquote":
      navigateToDevLauncher();
      break;
    case "Digit1":
    case "Numpad1":
      store.getState().requestEntrySwitch("digitalTwin");
      break;
    case "Digit2":
    case "Numpad2":
      store.getState().requestBitstreamEntrySwitch("sensor-telemetry");
      break;
    case "Digit3":
    case "Numpad3":
      store.getState().requestBitstreamEntrySwitch("sensor-studio");
      break;
    default:
      break;
  }
}

function onShellShortcutKeyDown(event: KeyboardEvent): void {
  if (isEditableTarget(event.target)) {
    return;
  }
  if (!isLauncherShortcut(event) && !isAppSwitchShortcut(event)) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  runShellShortcut(event.code);
}

let installed = false;

/**
 * Register shell shortcuts once (browser dev). Called from `main.tsx` after entry store init.
 */
export function installWebviewShellShortcuts(): void {
  if (installed || typeof document === "undefined") {
    return;
  }
  if (!isBrowserShellEnvironment()) {
    return;
  }
  installed = true;
  document.addEventListener("keydown", onShellShortcutKeyDown, true);
}

export function uninstallWebviewShellShortcuts(): void {
  if (!installed || typeof document === "undefined") {
    return;
  }
  installed = false;
  document.removeEventListener("keydown", onShellShortcutKeyDown, true);
}
