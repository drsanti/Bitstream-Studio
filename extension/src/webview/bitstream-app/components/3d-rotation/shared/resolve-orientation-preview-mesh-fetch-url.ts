import type { StudioAssetDescriptor } from "../../../../assets-manager/registry/asset.types.js";
import type { ModelEntry } from "../../../../model-catalog/modelCatalog-types";
import { resolveStudioModelGltfFetchUrl } from "../../../../sensor-studio/features/asset-browser/studio-model-scene-bindings.js";
import { resolveDefaultPreviewMeshGlbUrl } from "./resolveWebviewModelAssetUrl.js";

/**
 * Fetch URL for 3D Orientation — same resolver as Sensor Studio **Model Viewer**
 * ({@link resolveStudioModelGltfFetchUrl} + `catalog-model:${dedupeKey}` descriptors).
 */
export function resolveOrientationPreviewMeshFetchUrl(
  entry: ModelEntry | null,
  descriptors: readonly StudioAssetDescriptor[],
): string {
  if (entry == null) {
    return resolveDefaultPreviewMeshGlbUrl();
  }
  const studioAssetId = `catalog-model:${entry.dedupeKey.replace(/\\/g, "/").trim()}`;
  return resolveStudioModelGltfFetchUrl(
    { url: entry.url, studioAssetId },
    descriptors,
    resolveDefaultPreviewMeshGlbUrl(),
  );
}
