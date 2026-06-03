import type { StudioAssetDescriptor } from "../../../asset-browser/studio-asset.types";
import {
  getStudioModelDescriptorById,
  persistedModelUrlFromStudioDescriptor,
  resolveStudioModelGltfFetchUrl,
  STUDIO_MODEL_SELECT_CUSTOM,
} from "../../../asset-browser/studio-model-scene-bindings";

export { buildStudioModelCatalogSelectOptions } from "./studio-model-catalog-select-ui.js";
export { buildRotationInspectorModelCatalogSelectOptions } from "./studio-model-catalog-select-ui.js";

export function readStudioModelCatalogSelectValue(
  defaultConfig: Record<string, unknown>,
  descriptors: readonly StudioAssetDescriptor[],
): string {
  const assetId =
    typeof defaultConfig.selectedStudioAssetId === "string"
      ? defaultConfig.selectedStudioAssetId.trim()
      : "";
  if (assetId.length > 0) {
    const d = getStudioModelDescriptorById(assetId, descriptors);
    if (d != null) {
      return assetId;
    }
  }
  return STUDIO_MODEL_SELECT_CUSTOM;
}

/** Apply catalog pick to a **model-select** node `defaultConfig` (via `onUpdateField`). */
export function applyStudioModelCatalogSelectToNodeConfig(
  nextId: string,
  descriptors: readonly StudioAssetDescriptor[],
  onUpdateField: (key: string, value: unknown) => void,
): void {
  if (nextId === STUDIO_MODEL_SELECT_CUSTOM || nextId.length === 0) {
    onUpdateField("selectedStudioAssetId", "");
    onUpdateField("selectedModelUrl", "");
    return;
  }
  const d = getStudioModelDescriptorById(nextId, descriptors);
  if (d == null) {
    onUpdateField("selectedStudioAssetId", "");
    onUpdateField("selectedModelUrl", "");
    return;
  }
  const persisted = persistedModelUrlFromStudioDescriptor(d);
  const fetchUrl = resolveStudioModelGltfFetchUrl(
    { url: persisted, studioAssetId: d.id },
    descriptors,
    "",
  );
  onUpdateField("selectedStudioAssetId", d.id);
  onUpdateField("selectedModelUrl", fetchUrl);
}
