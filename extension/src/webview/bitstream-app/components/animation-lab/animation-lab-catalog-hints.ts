import { catalogDedupeKeyToResolveRelativePath } from "../../../model-catalog/modelCatalogMerge.js";
import { isStudioGlbAnimationPlaybackModeV1 } from "../../../sensor-studio/features/editor/gltf/studio-glb-animation-playback-mode.js";
import type { GlbPreviewCatalogTransform } from "../3d-rotation/shared/glb-preview-catalog-transform.types.js";
import type { GlbAnimationLabPlaybackMode } from "./glb-animation-lab.types.js";
import { parseAnimationLabCatalogTransform } from "./parse-animation-lab-catalog-transform.js";

export type AnimationLabCatalogTransform = GlbPreviewCatalogTransform;

export type AnimationLabQuickDemo = {
  id: string;
  label: string;
  /** Applied only when set and {@link preservePlaybackMode} is not true. */
  playbackMode?: GlbAnimationLabPlaybackMode;
  clip?: string;
  loopMode?: "loop" | "once" | "pingpong";
  /** When true, applies catalog `clipOrder` and sequence mode. */
  useSequenceOrder?: boolean;
  /** When true, keeps the operator's current mode (e.g. Single clip (loop) while in sequence). */
  preservePlaybackMode?: boolean;
};

export type AnimationLabCatalogHints = {
  defaultPreviewClip?: string;
  recommendedPlaybackMode?: GlbAnimationLabPlaybackMode;
  clipOrder?: string[];
  /** Friendly names for booth UI (`clipName` → label). */
  clipLabels?: Record<string, string>;
  /** One-tap presets in showcase inspector. */
  quickDemos?: AnimationLabQuickDemo[];
  /** Host override only — default viewport uses the glTF root transform from export. */
  transform?: AnimationLabCatalogTransform;
};

const metadataModules = {
  ...(import.meta.glob("../../../assets/free/models/**/*.json", {
    eager: true,
  }) as Record<string, unknown>),
  ...(import.meta.glob("../../../assets/tesaiot/models/**/*.json", {
    eager: true,
  }) as Record<string, unknown>),
  ...(import.meta.glob("../../../assets/models/**/*.json", {
    eager: true,
  }) as Record<string, unknown>),
};

function jsonModuleToObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null) {
    return null;
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "object" && "default" in (raw as object)) {
    const d = (raw as { default?: unknown }).default;
    if (d != null && typeof d === "object" && !Array.isArray(d)) {
      return d as Record<string, unknown>;
    }
  }
  return null;
}

function globPathToModelDirectory(globPath: string): string {
  const normalized = globPath.replace(/\\/g, "/");
  const assetsIdx = normalized.indexOf("/assets/");
  const tail =
    assetsIdx >= 0 ? normalized.slice(assetsIdx + "/assets/".length) : normalized.replace(/^\.\.\/+/, "");
  const segments = tail.split("/").filter(Boolean);
  if (segments.length < 2) {
    return "";
  }
  return segments.slice(0, -1).join("/");
}

function parseHintsBlock(data: Record<string, unknown>): AnimationLabCatalogHints | null {
  const block = data.animationLab ?? data.animation_lab;
  if (block == null || typeof block !== "object" || Array.isArray(block)) {
    return null;
  }
  const rec = block as Record<string, unknown>;
  const hints: AnimationLabCatalogHints = {};

  const defaultClip = rec.defaultPreviewClip ?? rec.default_preview_clip;
  if (typeof defaultClip === "string" && defaultClip.trim().length > 0) {
    hints.defaultPreviewClip = defaultClip.trim();
  }

  const mode = rec.recommendedPlaybackMode ?? rec.recommended_playback_mode;
  if (isStudioGlbAnimationPlaybackModeV1(mode)) {
    hints.recommendedPlaybackMode = mode;
  }

  const order = rec.clipOrder ?? rec.clip_order;
  if (Array.isArray(order)) {
    hints.clipOrder = order.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  }

  const transform = parseAnimationLabCatalogTransform(rec);
  if (transform != null) {
    hints.transform = transform;
  }

  const clipLabels = rec.clipLabels ?? rec.clip_labels;
  if (clipLabels != null && typeof clipLabels === "object" && !Array.isArray(clipLabels)) {
    const map: Record<string, string> = {};
    for (const [key, val] of Object.entries(clipLabels as Record<string, unknown>)) {
      if (typeof val === "string" && val.trim().length > 0) {
        map[key] = val.trim();
      }
    }
    if (Object.keys(map).length > 0) {
      hints.clipLabels = map;
    }
  }

  const quickDemos = rec.quickDemos ?? rec.quick_demos;
  if (Array.isArray(quickDemos)) {
    const demos: AnimationLabQuickDemo[] = [];
    for (const item of quickDemos) {
      if (item == null || typeof item !== "object" || Array.isArray(item)) {
        continue;
      }
      const row = item as Record<string, unknown>;
      const id = row.id;
      const label = row.label;
      if (typeof id !== "string" || id.trim().length === 0) {
        continue;
      }
      if (typeof label !== "string" || label.trim().length === 0) {
        continue;
      }
      const demo: AnimationLabQuickDemo = { id: id.trim(), label: label.trim() };
      const mode = row.playbackMode ?? row.playback_mode;
      if (isStudioGlbAnimationPlaybackModeV1(mode)) {
        demo.playbackMode = mode;
      }
      const clip = row.clip ?? row.defaultPreviewClip;
      if (typeof clip === "string" && clip.trim().length > 0) {
        demo.clip = clip.trim();
      }
      const loop = row.loopMode ?? row.loop_mode;
      if (loop === "loop" || loop === "once" || loop === "pingpong") {
        demo.loopMode = loop;
      }
      if (row.useSequenceOrder === true || row.use_sequence_order === true) {
        demo.useSequenceOrder = true;
      }
      if (row.preservePlaybackMode === true || row.preserve_playback_mode === true) {
        demo.preservePlaybackMode = true;
      }
      demos.push(demo);
    }
    if (demos.length > 0) {
      hints.quickDemos = demos;
    }
  }

  return Object.keys(hints).length > 0 ? hints : null;
}

const hintsByModelDirectory = new Map<string, AnimationLabCatalogHints>();

for (const [jsonPath, raw] of Object.entries(metadataModules)) {
  const data = jsonModuleToObject(raw);
  if (data == null) {
    continue;
  }
  const hints = parseHintsBlock(data);
  if (hints == null) {
    continue;
  }
  const dir = globPathToModelDirectory(jsonPath);
  if (dir.length > 0) {
    hintsByModelDirectory.set(dir.toLowerCase(), hints);
  }
}

function modelDirectoryFromDedupeKey(dedupeKey: string): string | null {
  const rel = catalogDedupeKeyToResolveRelativePath(dedupeKey);
  if (rel == null || rel.length === 0) {
    return null;
  }
  const dir = rel.replace(/\/[^/]+$/, "");
  return dir.length > 0 ? dir.toLowerCase() : null;
}

/**
 * Optional sidecar metadata beside a catalog GLB (`animationLab` block in `*_metadata.json`).
 */
export function resolveAnimationLabCatalogHints(dedupeKey: string): AnimationLabCatalogHints | null {
  const dir = modelDirectoryFromDedupeKey(dedupeKey);
  if (dir == null) {
    return null;
  }
  return hintsByModelDirectory.get(dir) ?? null;
}

/**
 * Filters catalog hints to clips that exist on the loaded GLB.
 */
export function normalizeAnimationLabCatalogHints(
  hints: AnimationLabCatalogHints,
  clipNames: readonly string[],
): AnimationLabCatalogHints {
  const set = new Set(clipNames);
  const out: AnimationLabCatalogHints = { ...hints };

  if (out.defaultPreviewClip != null && !set.has(out.defaultPreviewClip)) {
    delete out.defaultPreviewClip;
  }
  if (out.clipOrder != null) {
    out.clipOrder = out.clipOrder.filter((n) => set.has(n));
    if (out.clipOrder.length === 0) {
      delete out.clipOrder;
    }
  }
  if (out.clipLabels != null) {
    const next: Record<string, string> = {};
    for (const [key, label] of Object.entries(out.clipLabels)) {
      if (set.has(key)) {
        next[key] = label;
      }
    }
    if (Object.keys(next).length > 0) {
      out.clipLabels = next;
    } else {
      delete out.clipLabels;
    }
  }
  if (out.quickDemos != null) {
    out.quickDemos = out.quickDemos.filter((demo) => {
      if (demo.clip != null && !set.has(demo.clip)) {
        return false;
      }
      return true;
    });
    if (out.quickDemos.length === 0) {
      delete out.quickDemos;
    }
  }
  return out;
}
