import type { StudioAssetDescriptor } from "../../../asset-browser/studio-asset.types";
import {
  getStudioModelDescriptorById,
  resolveStudioModelDescriptorForPersistedModel,
} from "../../../asset-browser/studio-model-scene-bindings";

const ABSOLUTE_FETCH_URL_RE = /^(https?:|blob:|data:)/i;
const MODEL_FILE_EXT_RE = /\.(glb|gltf)$/i;

function stemFromFilename(filename: string): string {
  const base = filename.trim();
  if (base.length === 0) {
    return "";
  }
  return base.replace(MODEL_FILE_EXT_RE, "");
}

function shortNameFromUrl(url: string): string {
  const t = url.trim();
  if (t.length === 0) {
    return "";
  }
  let filename = "";
  try {
    if (ABSOLUTE_FETCH_URL_RE.test(t)) {
      const u = new URL(t);
      const seg = u.pathname.split("/").filter(Boolean).pop();
      if (seg != null && seg.length > 0) {
        filename = decodeURIComponent(seg);
      }
    }
  } catch {
    // ignore
  }
  if (filename.length === 0) {
    const norm = t.replace(/\\/g, "/");
    const parts = norm.split("/");
    const last = parts.filter(Boolean).pop();
    filename = last != null && last.length > 0 ? decodeURIComponent(last) : t;
  }
  const stem = stemFromFilename(filename);
  return stem.length > 0 ? stem : filename;
}

/** True when a live string value is probably a GLB/GLTF model path or URL. */
export function isLikelyModelUrlString(value: string): boolean {
  const t = value.trim();
  if (t.length === 0) {
    return false;
  }
  const norm = t.replace(/\\/g, "/");
  if (/\.(glb|gltf)(\?|#|$)/i.test(norm)) {
    return true;
  }
  return /^models\//i.test(norm);
}

/** Socket-row label for a model URL — catalog label when known, else filename stem (no path/extension). */
export function modelUrlSocketDisplayLabel(
  url: string,
  descriptors: readonly StudioAssetDescriptor[] = [],
): string {
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return "";
  }
  const inferred = resolveStudioModelDescriptorForPersistedModel(trimmed, null, descriptors);
  if (inferred != null) {
    return inferred.label;
  }
  return shortNameFromUrl(trimmed);
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
