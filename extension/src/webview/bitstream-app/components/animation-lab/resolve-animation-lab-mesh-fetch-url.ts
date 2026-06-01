import type { StudioAssetDescriptor } from "../../../assets-manager/registry/asset.types.js";
import type { ModelEntry } from "../../../model-catalog/modelCatalog-types";
import { resolveOrientationPreviewMeshFetchUrl } from "../3d-rotation/shared/resolve-orientation-preview-mesh-fetch-url.js";

/** Same URL resolution as Model Viewer / 3D Orientation (studio descriptors + catalog). */
export function resolveAnimationLabMeshFetchUrl(
  entry: ModelEntry | null,
  descriptors: readonly StudioAssetDescriptor[],
): string {
  return resolveOrientationPreviewMeshFetchUrl(entry, descriptors);
}
