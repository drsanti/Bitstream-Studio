import type { GlbPreviewCatalogTransform } from "../3d-rotation/shared/glb-preview-catalog-transform.types.js";

function parseVec3(raw: unknown): [number, number, number] | undefined {
  if (!Array.isArray(raw) || raw.length < 3) {
    return undefined;
  }
  const out: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < 3; i += 1) {
    const v = raw[i];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      return undefined;
    }
    out[i] = v;
  }
  return out;
}

/** Optional host-side transform from `animationLab.transform` metadata (not applied by default). */
export function parseAnimationLabCatalogTransform(
  block: Record<string, unknown>,
): GlbPreviewCatalogTransform | undefined {
  const raw = block.transform ?? block.modelTransform ?? block.model_transform;
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }
  const rec = raw as Record<string, unknown>;
  const position = parseVec3(rec.position);
  const rotationDeg = parseVec3(rec.rotationDeg ?? rec.rotation_deg ?? rec.rotation);
  const scale = parseVec3(rec.scale);
  if (position == null && rotationDeg == null && scale == null) {
    return undefined;
  }
  return { position, rotationDeg, scale };
}
