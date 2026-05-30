import type { TernionShellHostToWebviewMessage } from "../ternion-shell-host-message.js";
import { useBitstreamWorkspaceModeStore } from "./bitstream-app/state/bitstreamWorkspaceMode.store.js";
import { toggleQuickActionPalette } from "./quickActionToggle.js";

let installed = false;

function isShellHostMessage(data: unknown): data is TernionShellHostToWebviewMessage {
  if (typeof data !== "object" || data == null) {
    return false;
  }
  const msg = data as TernionShellHostToWebviewMessage;
  if (msg.type === "ternion-quick-action-toggle") {
    return true;
  }
  return (
    msg.type === "ternion-shell-navigate" &&
    (msg.workspace === "sensor-telemetry" || msg.workspace === "telemetry" || msg.workspace === "sensor-studio")
  );
}

/**
 * VS Code host → webview shell actions (workspace switch while Bitstream panel is open).
 */
export function installWebviewHostShellSync(): void {
  if (installed || typeof window === "undefined" || window.WEBVIEW_READY !== true) {
    return;
  }
  installed = true;

  const onMessage = (event: MessageEvent): void => {
    if (!isShellHostMessage(event.data)) {
      return;
    }
    if (event.data.type === "ternion-quick-action-toggle") {
      toggleQuickActionPalette();
      return;
    }
    useBitstreamWorkspaceModeStore.getState().setWorkspace(event.data.workspace);
  };

  window.addEventListener("message", onMessage);
}
