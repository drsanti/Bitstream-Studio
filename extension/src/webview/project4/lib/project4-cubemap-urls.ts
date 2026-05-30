const FACES = ["posx.jpg", "negx.jpg", "posy.jpg", "negy.jpg", "posz.jpg", "negz.jpg"] as const;

const FALLBACK_ONLINE_ROOT =
  "https://raw.githubusercontent.com/drsanti/ternion-3d-assets-free/main/assets";

/**
 * Absolute URLs for CubeTextureLoader (+x −x +y −y +z −z).
 * Prefers Vite dev middleware (`/__extension_src_assets/...`) when available;
 * uses bundled `./assets/textures/cubemap` via `LOCAL_ASSETS_BASE_URI` in packaged webview;
 * falls back to GitHub **`ONLINE_ASSETS_BASE_URI`** (Humus cubemaps on `ternion-3d-assets-free`).
 */
export function buildProject4TwinCubemapFaceUrls(setId: string): string[] {
  const folder = `textures/cubemap/${setId}`;
  const win = typeof window !== "undefined" ? window : undefined;
  const origin = win?.location.origin ?? "";

  const onlineRoot =
    win?.ONLINE_ASSETS_BASE_URI?.trim().replace(/\/+$/, "") ?? FALLBACK_ONLINE_ROOT;

  let root: string;
  if (import.meta.env.DEV && win?.WEBVIEW_READY !== true) {
    const local = win.LOCAL_ASSETS_BASE_URI?.trim().replace(/\/+$/, "") ?? "";
    if (local === "/__extension_src_assets" || local.endsWith("/__extension_src_assets")) {
      root = `${origin}${local}`;
    } else {
      root = onlineRoot;
    }
  } else if (win?.WEBVIEW_READY === true) {
    const base = win.LOCAL_ASSETS_BASE_URI?.trim().replace(/\/+$/, "") ?? "";
    if (base.startsWith("http://") || base.startsWith("https://")) {
      root = base;
    } else if (base.length > 0) {
      root = `${origin}/${base.replace(/^\/+/, "")}`;
    } else {
      root = onlineRoot;
    }
  } else {
    root = onlineRoot;
  }

  return FACES.map((f) => `${root}/${folder}/${f}`);
}
