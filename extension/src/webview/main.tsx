import "@/app.css";
import { createRoot } from "react-dom/client";
import { BS2SensorControlMonitor } from "./bs2-sensor-control-monitor";
import { BitstreamApp } from "./bitstream-shell/BitstreamApp";
import { installDevAssetBaseUris } from "./installDevAssetBaseUris";
import { installWebviewHostShellSync } from "./installWebviewHostShellSync";
import { installWebviewQuickActionShortcut } from "./installWebviewQuickActionShortcut";
import { initWebviewEntryStore } from "./state/webviewEntry.store";
import { installWebviewShellUrlSync } from "./state/webviewShellUrlSync";
import {
  resolveInitialWebviewEntry,
  shouldShowWebviewLauncher,
  syncDevLauncherHomeUrl,
} from "./ternion-webview-entry";
import { WebviewRoot } from "./WebviewRoot";

/**
 * Standalone BS2 monitor entry (default for local sensor-test work).
 * Restore full shell: set `VITE_USE_WEBVIEW_SHELL=1` or flip `USE_WEBVIEW_SHELL` below.
 */
const USE_WEBVIEW_SHELL =
  import.meta.env.VITE_USE_WEBVIEW_SHELL === "1" ||
  (typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("shell") === "1");

installDevAssetBaseUris();

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Missing #root element");
}

const STANDALONE_APP =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("standalone")
    : null;

/* Standalone dev tools bypass the launcher shell (even when `?launcher=1` or shell=1). */
if (STANDALONE_APP === "bs2-monitor")
{
  createRoot(rootEl).render(<BS2SensorControlMonitor />);
}
else if (!USE_WEBVIEW_SHELL)
{
  /* Main dev default: Bitstream app. */
  createRoot(rootEl).render(<BitstreamApp />);
}
else
{
  syncDevLauncherHomeUrl();
  installWebviewQuickActionShortcut();

  initWebviewEntryStore(resolveInitialWebviewEntry(), {
    showLauncher: shouldShowWebviewLauncher(),
  });

  installWebviewShellUrlSync();
  installWebviewHostShellSync();

  createRoot(rootEl).render(<WebviewRoot />);
}
