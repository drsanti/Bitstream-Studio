import "@/app.css";
import { createRoot } from "react-dom/client";
import { BitstreamApp } from "./bitstream-shell/BitstreamApp";
import { installDevAssetBaseUris } from "./installDevAssetBaseUris";

/**
 * Bitstream Studio webview entry — always mounts {@link BitstreamApp}.
 * Dev: `?app=bitstream` or `?app=sensor-studio` (workspace routing inside BitstreamApp).
 * VSIX: host sets `TERNION_WEBVIEW_APP` / `TERNION_BITSTREAM_WORKSPACE` before bundle load.
 */
installDevAssetBaseUris();

const rootEl = document.getElementById("root");
if (!rootEl)
{
  throw new Error("Missing #root element");
}

createRoot(rootEl).render(<BitstreamApp />);
