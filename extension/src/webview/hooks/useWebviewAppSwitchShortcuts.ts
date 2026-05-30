import { useEffect } from "react";
import { installWebviewShellShortcuts } from "./webviewShellShortcuts";

/** Re-assert shell shortcut registration when {@link WebviewRoot} mounts (no-op if already installed). */
export function useWebviewAppSwitchShortcuts(): void {
  useEffect(() => {
    installWebviewShellShortcuts();
  }, []);
}
