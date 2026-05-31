import { resolveWebviewModelAssetUrl } from "../../bitstream-app/components/3d-rotation/shared/resolveWebviewModelAssetUrl.js";
import type { AssetDescriptor } from "./asset.types.js";

const CUBEMAP_FACES = ["posx.jpg", "negx.jpg", "posy.jpg", "negy.jpg", "posz.jpg", "negz.jpg"] as const;

export type ResolvedAsset = {
  primaryUrl: string;
  cubemapFaceUrls?: string[];
};

export function resolveAsset(descriptor: AssetDescriptor): ResolvedAsset {
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

/** @deprecated Use {@link resolveAsset}. */
export const resolveStudioAsset = resolveAsset;

/** @deprecated Use {@link ResolvedAsset}. */
export type ResolvedStudioAsset = ResolvedAsset;
