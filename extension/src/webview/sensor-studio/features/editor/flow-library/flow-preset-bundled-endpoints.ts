import { joinAssetBase } from "../../../../asset-source-strategy";

export const FLOW_PRESET_BUNDLED_REL = "libraries/flow-preset/";

export const FLOW_PRESET_BUNDLED_DEV_PREFIX = "/__extension_src_assets/libraries/flow-preset/";

function isViteDevWebview(): boolean {
  return typeof import.meta !== "undefined" && import.meta.env?.DEV === true;
}

function webviewOriginRoot(): string {
  const base = import.meta.env?.BASE_URL ?? "./";
  if (typeof window === "undefined") {
    return base.endsWith("/") ? base : `${base}/`;
  }
  const root = new URL(base, window.location.href);
  return root.href.endsWith("/") ? root.href : `${root.href}/`;
}

/** Bundled official flow preset root (dev webview, VSIX, or node fallback). */
export function resolveBundledFlowPresetRoot(): string {
  if (typeof window !== "undefined") {
    const local = window.LOCAL_ASSETS_BASE_URI?.trim();
    if (local) {
      return joinAssetBase(local, FLOW_PRESET_BUNDLED_REL);
    }
  }

  if (isViteDevWebview() && typeof window !== "undefined") {
    return new URL(
      `__extension_src_assets/${FLOW_PRESET_BUNDLED_REL}`,
      webviewOriginRoot(),
    ).href;
  }

  if (typeof window === "undefined") {
    return `/assets/${FLOW_PRESET_BUNDLED_REL}`;
  }

  return new URL(`assets/${FLOW_PRESET_BUNDLED_REL}`, webviewOriginRoot()).href;
}

export function resolveBundledFlowPresetIndexUrl(): string {
  return joinAssetBase(resolveBundledFlowPresetRoot(), "index.json");
}

export function resolveBundledFlowPresetAssetUrl(fileName: string): string {
  const trimmed = fileName.trim().replace(/^\/+/, "");
  if (trimmed.length === 0) {
    return resolveBundledFlowPresetRoot();
  }
  return joinAssetBase(resolveBundledFlowPresetRoot(), trimmed);
}
