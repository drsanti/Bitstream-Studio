import type { StudioGlbMaterialTextureSlotV1 } from "./studio-glb-material-texture";
import { readGlbMaterialTextureSlot } from "./studio-glb-material-texture";

export type GlbMaterialVideoDriveEntry = {
  /** Flow node id of the upstream **`video-texture`** producer. */
  textureNodeId: string;
  /** Effective drive strength (wired gain or config blend). */
  gain: number;
  toneMapped: boolean;
};

export type GlbMaterialVideoDriveRow = Partial<
  Record<StudioGlbMaterialTextureSlotV1, GlbMaterialVideoDriveEntry>
>;

export function mergeGlbMaterialVideoDriveRow(
  row: GlbMaterialVideoDriveRow | undefined,
  slot: StudioGlbMaterialTextureSlotV1,
  entry: GlbMaterialVideoDriveEntry | null,
): GlbMaterialVideoDriveRow {
  const next: GlbMaterialVideoDriveRow = row != null ? { ...row } : {};
  if (entry == null || entry.gain <= 0) {
    delete next[slot];
    return next;
  }
  next[slot] = entry;
  return next;
}

export function glbMaterialVideoRowHasValues(
  row: GlbMaterialVideoDriveRow | undefined,
): boolean {
  if (row == null) {
    return false;
  }
  return Object.values(row).some(
    (entry) =>
      entry != null &&
      typeof entry.textureNodeId === "string" &&
      entry.textureNodeId.length > 0 &&
      entry.gain > 0,
  );
}

export function readMaterialVideoToneMapped(
  config: Record<string, unknown> | null | undefined,
): boolean {
  return config?.toneMapped === true;
}

export function readMaterialVideoBlend(
  config: Record<string, unknown> | null | undefined,
  liveGain?: unknown,
): number {
  if (typeof liveGain === "number" && Number.isFinite(liveGain)) {
    return Math.max(0, liveGain);
  }
  const raw = config?.blend;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? Math.max(0, n) : 1;
}

export function readMaterialVideoMapSlot(
  config: Record<string, unknown> | null | undefined,
): StudioGlbMaterialTextureSlotV1 {
  return readGlbMaterialTextureSlot(config);
}
