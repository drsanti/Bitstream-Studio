import type { LucideIcon } from "lucide-react";
import {
  Box,
  FileJson,
  FolderOpen,
  Globe2,
  Image,
  Music,
  Palette,
  Type,
} from "lucide-react";

export type FreePackAssetCategoryId =
  | "models"
  | "cubemaps"
  | "textures"
  | "audio"
  | "materials"
  | "fonts"
  | "metadata"
  | "other";

export type FreePackAssetCategoryMeta = {
  id: FreePackAssetCategoryId;
  label: string;
  icon: LucideIcon;
};

/** Display order for startup checklist asset activity rows. */
export const FREE_PACK_ASSET_CATEGORIES: readonly FreePackAssetCategoryMeta[] = [
  { id: "models", label: "Models", icon: Box },
  { id: "cubemaps", label: "Cubemaps", icon: Globe2 },
  { id: "textures", label: "Textures", icon: Image },
  { id: "materials", label: "Materials", icon: Palette },
  { id: "audio", label: "Audio", icon: Music },
  { id: "fonts", label: "Fonts", icon: Type },
  { id: "metadata", label: "Metadata", icon: FileJson },
  { id: "other", label: "Other assets", icon: FolderOpen },
] as const;

const CATEGORY_BY_ID = new Map(
  FREE_PACK_ASSET_CATEGORIES.map((c) => [c.id, c] as const),
);

export function classifyFreePackRelativePath(packRelative: string): FreePackAssetCategoryId {
  const p = packRelative.replace(/\\/g, "/").replace(/^\//, "").toLowerCase();
  if (p.startsWith("models/")) {
    return "models";
  }
  if (p.startsWith("textures/cubemap/") || p.includes("/cubemap/")) {
    return "cubemaps";
  }
  if (p.startsWith("textures/")) {
    return "textures";
  }
  if (p.startsWith("materials/")) {
    return "materials";
  }
  if (p.startsWith("audio/") || p.endsWith(".mp3") || p.endsWith(".wav") || p.endsWith(".ogg")) {
    return "audio";
  }
  if (p.startsWith("fonts/")) {
    return "fonts";
  }
  if (p.endsWith(".json") || p.endsWith(".md") || p.endsWith(".txt")) {
    return "metadata";
  }
  return "other";
}

export function freePackCategoryMeta(id: FreePackAssetCategoryId): FreePackAssetCategoryMeta {
  return CATEGORY_BY_ID.get(id) ?? CATEGORY_BY_ID.get("other")!;
}

export function summarizePathsByFreePackCategory(
  paths: readonly string[],
): Array<{ meta: FreePackAssetCategoryMeta; count: number }> {
  const counts = new Map<FreePackAssetCategoryId, number>();
  for (const path of paths) {
    const id = classifyFreePackRelativePath(path);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return FREE_PACK_ASSET_CATEGORIES.filter((c) => (counts.get(c.id) ?? 0) > 0).map((meta) => ({
    meta,
    count: counts.get(meta.id) ?? 0,
  }));
}

/** Repo-relative path from sync progress (`assets/models/...`) → pack-relative. */
export function packRelativeFromSyncProgressPath(currentPath: string | null | undefined): string | null {
  if (currentPath == null || currentPath.trim().length === 0) {
    return null;
  }
  const norm = currentPath.replace(/\\/g, "/").replace(/^\//, "");
  if (norm.startsWith("assets/")) {
    return norm.slice("assets/".length);
  }
  return norm;
}
