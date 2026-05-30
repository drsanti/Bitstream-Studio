import React from "react";
import { installDevAssetBaseUris } from "../installDevAssetBaseUris";
import { installWebviewHostShellSync } from "../installWebviewHostShellSync";
import { installWebviewQuickActionShortcut } from "../installWebviewQuickActionShortcut";
import { resolveInitialWebviewEntry, shouldShowWebviewLauncher } from "../ternion-webview-entry";
import { getWebviewEntryStore, initWebviewEntryStore } from "../state/webviewEntry.store";
import { installWebviewShellUrlSync } from "../state/webviewShellUrlSync";

let runtimeInstalled = false;

/**
 * Installs the webview runtime wiring needed by Bitstream/Sensor Studio apps:
 * - asset base URIs (dev browser)
 * - shell store init (so any code using useWebviewEntryStore is safe)
 * - host navigation + quick action toggle (VS Code webview)
 * - Ctrl+/ quick actions shortcut (browser dev + VS Code webview)
 * - optional URL sync (browser dev shell URLs)
 *
 * Safe to mount multiple times (guards against duplicate installs).
 */
export function WebviewRuntimeInstaller()
{
  const installedRef = React.useRef(false);

  React.useEffect(() => {
    if (installedRef.current || runtimeInstalled)
    {
      return;
    }
    installedRef.current = true;
    runtimeInstalled = true;

    installDevAssetBaseUris();
    installWebviewQuickActionShortcut();
    installWebviewHostShellSync();

    /* Init the webview entry store if it is not already initialized. */
    try
    {
      getWebviewEntryStore();
    }
    catch
    {
      initWebviewEntryStore(resolveInitialWebviewEntry(), {
        showLauncher: shouldShowWebviewLauncher(),
      });
    }

    /* Browser-only: keep shell store aligned with Back/Forward when URL has shell state. */
    installWebviewShellUrlSync();
  }, []);

  return null;
}

