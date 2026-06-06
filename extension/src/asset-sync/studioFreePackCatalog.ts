/**
 * Studio-aligned free-pack model folder ids (nine models).
 * Source of truth: bundled {@link ../webview/assets-manager/registry/free-pack-model-ids.v1.json}.
 * Excludes retired upstream-only folders (e.g. `robot-4th-project`).
 */
import studioModelFolderIds from "../webview/assets-manager/registry/free-pack-model-ids.v1.json";

export const STUDIO_FREE_PACK_MODEL_FOLDER_IDS = studioModelFolderIds as readonly string[];

const STUDIO_MODEL_FOLDER_SET = new Set<string>(STUDIO_FREE_PACK_MODEL_FOLDER_IDS);

/** Repo path `assets/models/<folder>/…` when `<folder>` is a model pack directory. */
export function parseFreePackModelFolderFromRepoPath(repoPath: string): string | null {
  const norm = repoPath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!norm.startsWith("assets/models/")) {
    return null;
  }
  const rest = norm.slice("assets/models/".length);
  const slash = rest.indexOf("/");
  if (slash <= 0) {
    return null;
  }
  return rest.slice(0, slash);
}

/**
 * True when `repoPath` is allowed under studio-aligned full-pack sync.
 * Non-model paths (textures, feeds, manifests at pack root) pass through.
 * `assets/models/manifest.json` and other direct children of `assets/models/` pass through.
 */
export function isStudioAlignedFreePackRepoPath(repoPath: string): boolean {
  const folderId = parseFreePackModelFolderFromRepoPath(repoPath);
  if (folderId == null) {
    return true;
  }
  return STUDIO_MODEL_FOLDER_SET.has(folderId);
}

export function filterRepoPathsToStudioFreePackCatalog(repoPaths: readonly string[]): {
  kept: string[];
  skipped: string[];
} {
  const kept: string[] = [];
  const skipped: string[] = [];
  for (const repoPath of repoPaths) {
    if (isStudioAlignedFreePackRepoPath(repoPath)) {
      kept.push(repoPath);
    } else {
      skipped.push(repoPath);
    }
  }
  return { kept, skipped };
}

export function filterIndexEntriesToStudioFreePackCatalog<
  T extends { repoPath: string },
>(entries: readonly T[]): { kept: T[]; skipped: T[] } {
  const kept: T[] = [];
  const skipped: T[] = [];
  for (const entry of entries) {
    if (isStudioAlignedFreePackRepoPath(entry.repoPath)) {
      kept.push(entry);
    } else {
      skipped.push(entry);
    }
  }
  return { kept, skipped };
}
