/** Extension semver from `package.json` (Vite `define` in dev and `build:webview`). */
export const BITSTREAM_STUDIO_PRODUCT_VERSION =
  import.meta.env.VITE_BITSTREAM_STUDIO_VERSION ?? "0.0.0";

export function bitstreamProductVersionLabel(): string {
  return `v${BITSTREAM_STUDIO_PRODUCT_VERSION}`;
}
