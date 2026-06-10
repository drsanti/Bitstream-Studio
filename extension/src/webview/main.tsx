import "@/app.css";
import { createRoot, type Root } from "react-dom/client";
import { BitstreamWebviewRoot } from "./landing/BitstreamWebviewRoot";
import { installDevAssetBaseUris } from "./installDevAssetBaseUris";
import { unregisterStaleCoiServiceWorker } from "./utils/unregisterStaleCoiServiceWorker";

/**
 * Bitstream Studio webview entry — {@link BitstreamWebviewRoot} (dev landing + app).
 * Dev: `/` shows landing; `?app=bitstream` skips it; `?landing=1` forces it.
 * VSIX: host sets `TERNION_WEBVIEW_APP` / `TERNION_BITSTREAM_WORKSPACE` before bundle load.
 */
installDevAssetBaseUris();

/** Reused across Vite HMR updates — avoid createRoot() on an already-rooted container. */
let appRoot: Root | undefined;

type WebviewMainHotData = {
  appRoot?: Root;
};

const hot = import.meta.hot;

if (hot)
{
  hot.dispose((data: WebviewMainHotData) =>
  {
    data.appRoot = appRoot;
  });
}

/** Remove static HTML boot shell once, before the first createRoot (cold boot only). */
function dismissBitstreamBootShell(): void
{
  document.getElementById("bitstream-boot-shell")?.remove();
}

function resolveAppRoot(rootEl: HTMLElement): Root
{
  if (appRoot != null)
  {
    return appRoot;
  }

  const persisted = hot?.data.appRoot as Root | undefined;
  if (persisted != null)
  {
    appRoot = persisted;
    return appRoot;
  }

  dismissBitstreamBootShell();
  appRoot = createRoot(rootEl);
  if (hot)
  {
    (hot.data as WebviewMainHotData).appRoot = appRoot;
  }
  return appRoot;
}

function mountWebviewRoot(): void
{
  const rootEl = document.getElementById("root");
  if (!rootEl)
  {
    throw new Error("Missing #root element");
  }

  resolveAppRoot(rootEl).render(<BitstreamWebviewRoot />);
}

// Paint immediately — do not block first render on async service-worker cleanup.
mountWebviewRoot();

void unregisterStaleCoiServiceWorker().catch(() =>
{
  // Cleanup is best-effort; a follow-up reload is triggered when a COI controller is active.
});

if (hot)
{
  hot.accept(() =>
  {
    mountWebviewRoot();
  });
}
