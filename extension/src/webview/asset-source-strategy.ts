export type AssetSourceStrategy = "local-only" | "local-first" | "online-only";

const LS_KEY = "ternion.assetSourceStrategy";

function isValid(v: unknown): v is AssetSourceStrategy {
  return v === "local-only" || v === "local-first" || v === "online-only";
}

export function getAssetSourceStrategy(): AssetSourceStrategy {
  if (typeof window !== "undefined") {
    const fromWindow = (window as Window & { ASSET_SOURCE_STRATEGY?: unknown }).ASSET_SOURCE_STRATEGY;
    if (isValid(fromWindow)) {
      return fromWindow;
    }
    try {
      const fromLs = window.localStorage?.getItem(LS_KEY);
      if (isValid(fromLs)) {
        return fromLs;
      }
    } catch {
      // ignore localStorage failures
    }
  }
  return "local-first";
}

export function joinAssetBase(base: string, relativePath: string): string {
  const normalized = base.endsWith("/") ? base : `${base}/`;
  const rel = relativePath.replace(/^\//, "");
  return `${normalized}${rel}`;
}
