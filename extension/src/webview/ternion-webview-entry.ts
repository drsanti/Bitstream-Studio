/**
 * Which React root the bundled webview mounts. The extension host sets
 * `window.TERNION_WEBVIEW_APP` in the inline preload script (before `index.js`).
 */
import type { WebviewShellEntry } from "./state/webviewEntryPersistence.js";

export type TernionWebviewEntry = "bitstream";

/** Bitstream Studio ships a single webview product surface. */
export function resolveTernionWebviewEntry(): TernionWebviewEntry
{
  if (typeof window !== "undefined" && window.WEBVIEW_READY === true)
  {
    return "bitstream";
  }

  if (typeof window !== "undefined" && import.meta.env.DEV)
  {
    try
    {
      const app = new URLSearchParams(window.location.search).get("app");
      if (
        app === "bitstream" ||
        app === "sensor-studio" ||
        app === "sensor-telemetry"
      )
      {
        return "bitstream";
      }
    }
    catch
    {
      // ignore
    }
  }

  return "bitstream";
}

/** Launcher shell removed — Bitstream Studio uses direct app URLs only. */
export function shouldShowWebviewLauncher(): boolean
{
  return false;
}

/** No-op: legacy Digital Twin launcher home URL sync. */
export function syncDevLauncherHomeUrl(): void
{
}

/** Initial shell entry for stores that still read persisted dev state. */
export function resolveInitialWebviewEntry(): WebviewShellEntry
{
  return "bitstream";
}
