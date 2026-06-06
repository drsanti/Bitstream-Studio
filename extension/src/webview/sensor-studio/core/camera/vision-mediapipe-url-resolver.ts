import { joinAssetBase } from "../../../asset-source-strategy";
import {
  isVisionMediapipeCorePackFile,
  VISION_MEDIAPIPE_PACK_REL,
} from "../../../../asset-sync/visionMediapipeFreePack";

function webviewOriginRoot(): string {
  const base = import.meta.env?.BASE_URL ?? "./";
  if (typeof window === "undefined") {
    return base.endsWith("/") ? base : `${base}/`;
  }
  const root = new URL(base, window.location.href);
  return root.href.endsWith("/") ? root.href : `${root.href}/`;
}

function injectedBases(): { local: string; free: string; online: string } {
  if (typeof window === "undefined") {
    return { local: "", free: "", online: "" };
  }
  return {
    local: window.LOCAL_ASSETS_BASE_URI?.trim() ?? "",
    free: window.FREE_ASSETS_BASE_URI?.trim() ?? "",
    online: window.ONLINE_ASSETS_BASE_URI?.trim() ?? "",
  };
}

/**
 * Resolve one file under `vision/mediapipe/` using free-pack base order.
 * @param relativeInsidePack e.g. `wasm/vision_wasm_internal.wasm` or `hand_landmarker.task`
 */
export function resolveVisionMediapipePackAssetUrl(relativeInsidePack: string): string {
  const file = relativeInsidePack.replace(/\\/g, "/").replace(/^\/+/, "");
  const packRel = `${VISION_MEDIAPIPE_PACK_REL}${file}`;
  const { local, free, online } = injectedBases();
  const isCore = isVisionMediapipeCorePackFile(file);

  const ordered = isCore
    ? [local, free, online]
    : [free, online, local];

  for (const base of ordered) {
    if (base.length > 0) {
      return joinAssetBase(base, packRel);
    }
  }

  if (import.meta.env?.DEV && typeof window !== "undefined") {
    return new URL(`__extension_src_assets/${packRel}`, webviewOriginRoot()).href;
  }

  if (online.length > 0) {
    return joinAssetBase(online, packRel);
  }

  const fallbackRoot = `/assets/${VISION_MEDIAPIPE_PACK_REL}`;
  return `${fallbackRoot}${file}`;
}

export function resolveVisionMediapipeWasmBaseUrl(): string {
  return resolveVisionMediapipePackAssetUrl("wasm");
}
