import {
  syncBitstreamWorkspaceToUrl,
  useBitstreamWorkspaceModeStore,
  type BitstreamWorkspaceId,
} from "../bitstream-app/state/bitstreamWorkspaceMode.store";
import { isBrowserShellEnvironment } from "../state/webviewShellUrl";

/** App switch digits (use `event.code` — `event.key` is shifted symbols with Ctrl+Shift). */
const APP_SWITCH_CODES = new Set([
  "Digit1",
  "Digit2",
  "Numpad1",
  "Numpad2",
]);

function isEditableTarget(target: EventTarget | null): boolean
{
  if (!(target instanceof HTMLElement))
  {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function hasShellModifiers(event: KeyboardEvent): boolean
{
  return event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey;
}

function isAppSwitchShortcut(event: KeyboardEvent): boolean
{
  return hasShellModifiers(event) && APP_SWITCH_CODES.has(event.code);
}

function switchBitstreamWorkspace(workspace: BitstreamWorkspaceId): void
{
  useBitstreamWorkspaceModeStore.setState({ workspace });
  syncBitstreamWorkspaceToUrl(workspace, true);
}

function runShellShortcut(code: string): void
{
  switch (code)
  {
    case "Digit1":
    case "Numpad1":
      switchBitstreamWorkspace("sensor-telemetry");
      break;
    case "Digit2":
    case "Numpad2":
      switchBitstreamWorkspace("sensor-studio");
      break;
    default:
      break;
  }
}

function onShellShortcutKeyDown(event: KeyboardEvent): void
{
  if (isEditableTarget(event.target))
  {
    return;
  }
  if (!isAppSwitchShortcut(event))
  {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  runShellShortcut(event.code);
}

let installed = false;

/**
 * Register workspace switch shortcuts once (browser dev). Ctrl+Shift+1 telemetry, +2 studio.
 */
export function installWebviewShellShortcuts(): void
{
  if (installed || typeof document === "undefined")
  {
    return;
  }
  if (!isBrowserShellEnvironment())
  {
    return;
  }
  installed = true;
  document.addEventListener("keydown", onShellShortcutKeyDown, true);
}

export function uninstallWebviewShellShortcuts(): void
{
  if (!installed || typeof document === "undefined")
  {
    return;
  }
  installed = false;
  document.removeEventListener("keydown", onShellShortcutKeyDown, true);
}
