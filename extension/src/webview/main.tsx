import "@/app.css";
import { createRoot } from "react-dom/client";
import { BitstreamWebviewRoot } from "./landing/BitstreamWebviewRoot";
import { installDevAssetBaseUris } from "./installDevAssetBaseUris";

/**
 * Bitstream Studio webview entry — {@link BitstreamWebviewRoot} (dev landing + app).
 * Dev: `/` shows landing; `?app=bitstream` skips it; `?landing=1` forces it.
 * VSIX: host sets `TERNION_WEBVIEW_APP` / `TERNION_BITSTREAM_WORKSPACE` before bundle load.
 */
installDevAssetBaseUris();

const rootEl = document.getElementById("root");
if (!rootEl)
{
  throw new Error("Missing #root element");
}

createRoot(rootEl).render(<BitstreamWebviewRoot />);
