import { resolveWebviewModelAssetUrl } from "../../../bitstream-app/components/3d-rotation/shared/resolveWebviewModelAssetUrl";
import type { StudioAssetDescriptor } from "./studio-asset.types";

const CUBEMAP_FACES = ["posx.jpg", "negx.jpg", "posy.jpg", "negy.jpg", "posz.jpg", "negz.jpg"] as const;

export type ResolvedStudioAsset = {
  /** Main URL for preview / copy (first cubemap face when category is environment). */
  primaryUrl: string;
  /** Full cubemap face URLs (+x −x +y −y +z −z) when applicable. */
  cubemapFaceUrls?: string[];
};

/**
 * Resolve a catalog descriptor to concrete fetch URLs using the same webview rules as
 * rotation preview / Bitstream (`FREE_ASSETS_BASE_URI`, `LOCAL_ASSETS_BASE_URI`, strategy).
 */
export function resolveStudioAsset(descriptor: StudioAssetDescriptor): ResolvedStudioAsset {
  if (descriptor.externalUrl != null && descriptor.externalUrl.length > 0) {
    return { primaryUrl: descriptor.externalUrl };
  }
  if (descriptor.relativePath != null && descriptor.relativePath.length > 0) {
    const primaryUrl = resolveWebviewModelAssetUrl(descriptor.relativePath);
    return { primaryUrl };
  }
  if (descriptor.primaryUrlOverride != null && descriptor.primaryUrlOverride.length > 0) {
    return { primaryUrl: descriptor.primaryUrlOverride };
  }
  if (descriptor.cubemapFaceBasePath != null && descriptor.cubemapFaceBasePath.length > 0) {
    const base = descriptor.cubemapFaceBasePath.replace(/\/+$/, "");
    const cubemapFaceUrls = CUBEMAP_FACES.map((face) =>
      resolveWebviewModelAssetUrl(`${base}/${face}`),
    );
    return {
      primaryUrl: cubemapFaceUrls[0] ?? "",
      cubemapFaceUrls,
    };
  }
  if (descriptor.cubemapSetId != null && descriptor.cubemapSetId.length > 0) {
    const baseFolder = `textures/cubemap/${descriptor.cubemapSetId}`;
    const cubemapFaceUrls = CUBEMAP_FACES.map((face) =>
      resolveWebviewModelAssetUrl(`${baseFolder}/${face}`),
    );
    return {
      primaryUrl: cubemapFaceUrls[0] ?? "",
      cubemapFaceUrls,
    };
  }
  return { primaryUrl: "" };
}
