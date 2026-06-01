import { useBitstreamWorkspaceModeStore } from "../../state/bitstreamWorkspaceMode.store.js";
import { usePreviewMeshMissingUiStore } from "../../state/previewMeshMissingUi.store.js";
import type { ModelEntry } from "../../../model-catalog/modelCatalog-types.js";
import type { AssetDescriptor } from "../../../assets-manager/registry/asset.types.js";
import { ANIMATION_LAB_OPEN_MODEL_EVENT } from "./animation-lab-constants.js";
import { persistAnimationLabModelId } from "./animation-lab-persistence.js";

const CATALOG_MODEL_DESCRIPTOR_PREFIX = "catalog-model:";

/** Animation Lab model picker uses {@link ModelEntry.id} (stable catalog row id, usually the asset URL key). */
export function animationLabModelIdFromCatalogEntry(entry: Pick<ModelEntry, "id">): string {
  return entry.id;
}

export function animationLabModelIdFromAssetDescriptor(
  descriptor: Pick<AssetDescriptor, "id">,
  catalogEntries: readonly ModelEntry[],
): string | null {
  if (!descriptor.id.startsWith(CATALOG_MODEL_DESCRIPTOR_PREFIX)) {
    return null;
  }
  const dedupeKey = descriptor.id.slice(CATALOG_MODEL_DESCRIPTOR_PREFIX.length);
  const match = catalogEntries.find((m) => m.dedupeKey === dedupeKey);
  return match?.id ?? null;
}

/**
 * Switch to Sensor Telemetry workbench and select the catalog model in GLB Animation Lab.
 */
export function openAnimationLabForCatalogModel(modelId: string): void {
  const id = modelId.trim();
  if (id.length === 0) {
    return;
  }
  persistAnimationLabModelId(id);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(ANIMATION_LAB_OPEN_MODEL_EVENT, { detail: { modelId: id } }),
    );
  }
  usePreviewMeshMissingUiStore.getState().setModelCatalogOpen(false);
  useBitstreamWorkspaceModeStore.getState().setWorkspace("sensor-telemetry");
}

export function openAnimationLabForCatalogEntry(entry: Pick<ModelEntry, "id">): void {
  openAnimationLabForCatalogModel(animationLabModelIdFromCatalogEntry(entry));
}

export function openAnimationLabForAssetDescriptor(
  descriptor: Pick<AssetDescriptor, "id">,
  catalogEntries: readonly ModelEntry[],
): boolean {
  const modelId = animationLabModelIdFromAssetDescriptor(descriptor, catalogEntries);
  if (modelId == null) {
    return false;
  }
  openAnimationLabForCatalogModel(modelId);
  return true;
}
