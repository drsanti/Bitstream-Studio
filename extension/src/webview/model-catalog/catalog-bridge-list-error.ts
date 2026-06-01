/** Maps bridge catalog-list failures to user-facing copy (see ModelCatalogBridgeDownloaded). */

export type CatalogBridgeListErrorPresentation = {
  title: string;
  message: string;
  detail?: string;
  /** When false, log only — avoids blocking Sensor Studio when the bridge is down in Vite dev. */
  showDialog: boolean;
};

function isAssetLayoutError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("standalonebridgeassetlayouterror") ||
    lower.includes("could not resolve") ||
    lower.includes("ternion_bridge_") ||
    lower.includes("globalstorage") ||
    lower.includes("asset directory") ||
    lower.includes("asset layout")
  );
}

function isConnectivityError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("request timeout") ||
    lower.includes("not connected") ||
    lower.includes("websocket") ||
    lower.includes("connection") ||
    lower.includes("econnrefused") ||
    lower.includes("failed to connect")
  );
}

export function resolveCatalogBridgeListErrorPresentation(
  err: unknown,
): CatalogBridgeListErrorPresentation {
  const raw = err instanceof Error ? err.message : String(err);
  const message = raw.trim() || "Unknown error";

  if (isConnectivityError(message)) {
    return {
      title: "Asset bridge not reachable",
      message:
        "The webview could not list local downloaded models from the model-downloader bridge within the timeout window.",
      detail: [
        message,
        "",
        "Typical dev fix:",
        "• Terminal 1: npm run start:bridge (from extension/)",
        "• Terminal 2: npm run dev:webview",
        "• Hard-reload the browser tab if the bridge was started after the page loaded.",
      ].join("\n"),
      showDialog: false,
    };
  }

  if (isAssetLayoutError(message)) {
    return {
      title: "Local asset directories are not configured",
      message:
        "The bridge cannot resolve where to scan downloaded models on disk. Configure globalStorage (open the extension in VS Code once), set TERNION_BRIDGE_* env vars, or use the monorepo ternion-t3d/assets tree — then restart the bridge.",
      detail: message,
      showDialog: true,
    };
  }

  return {
    title: "Could not load local downloaded models",
    message: "The bridge returned an error while scanning the catalog download folders.",
    detail: message,
    showDialog: true,
  };
}
