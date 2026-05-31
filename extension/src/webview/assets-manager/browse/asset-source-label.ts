import type { AssetSource } from "../registry/asset.types.js";

/** User-facing label for asset source badges (not internal enum names). */
export function assetSourceLabel(source: AssetSource): string {
  switch (source) {
    case "bundled":
      return "Included";
    case "pack":
      return "Free pack";
    case "downloaded":
      return "On this device";
    case "external":
      return "From web";
    default:
      return source;
  }
}
