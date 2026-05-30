import type { StudioAssetDescriptor } from "../../../asset-browser/studio-asset.types";
import {
  getStudioModelDescriptorById,
  resolveStudioModelDescriptorForPersistedModel,
} from "../../../asset-browser/studio-model-scene-bindings";

const ABSOLUTE_FETCH_URL_RE = /^(https?:|blob:|data:)/i;

function shortNameFromUrl(url: string): string {
  const t = url.trim();
  if (t.length === 0) {
    return "";
  }
  try {
    if (ABSOLUTE_FETCH_URL_RE.test(t)) {
      const u = new URL(t);
      const seg = u.pathname.split("/").filter(Boolean).pop();
      if (seg != null && seg.length > 0) {
        return decodeURIComponent(seg);
      }
    }
  } catch {
    // ignore
  }
  const norm = t.replace(/\\/g, "/");
  const parts = norm.split("/");
  const last = parts.filter(Boolean).pop();
  return last != null && last.length > 0 ? decodeURIComponent(last) : t;
}

/**
 * Human-readable name for what a **model-select** node currently emits on **`out`**
 * (`selectedStudioAssetId` + `selectedModelUrl`), matching the Model card dropdown labels when possible.
 */
export function modelSelectEmitDisplayName(
  defaultConfig: Record<string, unknown>,
  descriptors: readonly StudioAssetDescriptor[],
): string {
  const assetId =
    typeof defaultConfig.selectedStudioAssetId === "string"
      ? defaultConfig.selectedStudioAssetId.trim()
      : "";
  const url =
    typeof defaultConfig.selectedModelUrl === "string" ? defaultConfig.selectedModelUrl.trim() : "";

  if (assetId.length > 0) {
    const d = getStudioModelDescriptorById(assetId, descriptors);
    if (d != null) {
      return d.label;
    }
  }

  if (url.length > 0) {
    const inferred = resolveStudioModelDescriptorForPersistedModel(
      url,
      assetId.length > 0 ? assetId : null,
      descriptors,
    );
    if (inferred != null) {
      return inferred.label;
    }
    const fromUrl = shortNameFromUrl(url);
    if (fromUrl.length > 0) {
      return fromUrl;
    }
  }

  return "";
}
