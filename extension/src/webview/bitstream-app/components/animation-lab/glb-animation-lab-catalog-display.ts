/**
 * Human-readable catalog id for Animation Lab inspector (internal `dedupeKey`).
 */

export type FormattedCatalogId = {
  /** Short label, e.g. `tesa-drone/tesa-drone.glb` */
  short: string;
  /** Whether the key used the packaged `mirror:` merge prefix */
  isMirrorPackaged: boolean;
};

export function formatAnimationLabCatalogId(dedupeKey: string): FormattedCatalogId | null {
  const k = dedupeKey.replace(/\\/g, "/").trim();
  if (k.length === 0) {
    return null;
  }
  if (k.startsWith("mirror:")) {
    const rest = k.slice("mirror:".length);
    return { short: rest.length > 0 ? rest : k, isMirrorPackaged: true };
  }
  return { short: k, isMirrorPackaged: false };
}

export const ANIMATION_LAB_CATALOG_ID_HINT =
  "Catalog id merges duplicate packaged paths (assets/models vs assets/free/models). " +
  "The cyan line is the URL loaded at runtime. " +
  "mirror: means the same GLB under any …/models/… tree.";
