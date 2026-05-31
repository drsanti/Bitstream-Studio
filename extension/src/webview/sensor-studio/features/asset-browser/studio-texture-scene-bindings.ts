import type { StudioAssetDescriptor } from "./studio-asset.types";
import { resolveStudioAsset } from "./resolveStudioAsset";

export const STUDIO_TEXTURE_SELECT_NONE = "" as const;

export function listStudioTextureDescriptors(
  descriptors: readonly StudioAssetDescriptor[],
): StudioAssetDescriptor[] {
  return descriptors
    .filter((d) => d.category === "texture")
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function getStudioTextureDescriptorById(
  id: string,
  descriptors: readonly StudioAssetDescriptor[],
): StudioAssetDescriptor | null {
  const trimmed = id.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const d = descriptors.find((x) => x.id === trimmed);
  if (d == null || d.category !== "texture") {
    return null;
  }
  return d;
}

export function resolveStudioTextureFetchUrl(descriptor: StudioAssetDescriptor): string {
  return resolveStudioAsset(descriptor).primaryUrl.trim();
}
