/** Expand `${ONLINE_ASSETS_BASE_URI}`, `${FREE_ASSETS_BASE_URI}`, `${LOCAL_ASSETS_BASE_URI}` for loaders (`useGLTF`, etc.). */

import { rewriteLegacyViteAssetPathForWebview } from "../../model-catalog/resolve-catalog-model-preview-url";

export function resolveProject4RobotModelUrl(modelUrl: string): string {
  const trimmed = modelUrl.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }

  let out = rewriteLegacyViteAssetPathForWebview(trimmed);
  if (typeof window !== "undefined") {
    const win = window;
    const onlineBase = win.ONLINE_ASSETS_BASE_URI?.trim().replace(/\/+$/, "") ?? "";
    const freeBase = win.FREE_ASSETS_BASE_URI?.trim().replace(/\/+$/, "") ?? "";
    const localBase = win.LOCAL_ASSETS_BASE_URI?.trim().replace(/\/+$/, "") ?? "";
    out = out.replace(/\$\{ONLINE_ASSETS_BASE_URI\}/g, onlineBase);
    out = out.replace(/\$\{FREE_ASSETS_BASE_URI\}/g, freeBase);
    out = out.replace(/\$\{LOCAL_ASSETS_BASE_URI\}/g, localBase);
  }

  if (out.startsWith("http://") || out.startsWith("https://")) {
    return out;
  }

  if (typeof window !== "undefined") {
    if (out.startsWith("/")) {
      return `${window.location.origin}${out}`;
    }
    return `${window.location.origin}/${out.replace(/^\.\//, "")}`;
  }

  return out;
}
