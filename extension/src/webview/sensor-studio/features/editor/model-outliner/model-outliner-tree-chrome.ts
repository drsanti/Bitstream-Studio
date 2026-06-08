import type { LucideIcon } from "lucide-react";
import {
  Bone,
  Box,
  Camera,
  Circle,
  Clapperboard,
  Folder,
  Lightbulb,
  Palette,
  ScanFace,
  Sparkles,
} from "lucide-react";
import type { StudioGltfExtractRow } from "../gltf/studio-gltf-extract";
import type { StudioGltfSceneTreeNode } from "../gltf/studio-gltf-extract";
import type { ModelOutlinerTypeFilter } from "./model-outliner-type-filter";

export function modelOutlinerShowRowKindBadge(typeFilter: ModelOutlinerTypeFilter): boolean {
  return typeFilter === "all";
}

export function modelOutlinerTreeRowClass(selected: boolean, placed: boolean): string {
  const base =
    "flex min-h-[22px] w-full min-w-0 flex-1 items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] transition-colors";
  if (selected) {
    return `${base} bg-cyan-950/35 text-cyan-50`;
  }
  if (placed) {
    return `${base} text-emerald-100/90 hover:bg-zinc-900/65`;
  }
  return `${base} text-zinc-200 hover:bg-zinc-900/65`;
}

export function modelOutlinerExtractRowClass(selected: boolean, placed: boolean): string {
  const base =
    "flex w-full min-w-0 items-center justify-between gap-2 rounded px-1 py-0.5 text-left text-[10px] transition-colors";
  if (selected) {
    return `${base} bg-cyan-950/35 text-cyan-50`;
  }
  if (placed) {
    return `${base} text-emerald-100/90 hover:bg-zinc-900/65`;
  }
  return `${base} text-zinc-200 hover:bg-zinc-900/65`;
}

export function modelOutlinerLegacyExtractRowClass(dense: boolean): string {
  return dense
    ? "flex w-full min-w-0 items-center justify-between gap-2 rounded border border-zinc-800/70 bg-zinc-950/40 px-2 py-1 text-left text-[10px] text-zinc-200 transition-colors hover:border-cyan-500/35 hover:bg-zinc-900/60"
    : "flex w-full min-w-0 items-center justify-between gap-2 rounded border border-zinc-800/70 bg-zinc-950/40 px-2 py-1.5 text-left text-[11px] text-zinc-200 transition-colors hover:border-cyan-500/35 hover:bg-zinc-900/60";
}

export function resolveSceneTreeNodeIcon(node: StudioGltfSceneTreeNode): LucideIcon {
  switch (node.nodeType) {
    case "light":
      return Lightbulb;
    case "camera":
      return Camera;
    case "bone":
      return Bone;
    case "mesh":
      return Box;
    case "group":
      return Folder;
    default:
      return Circle;
  }
}

export function resolveExtractRowIcon(row: StudioGltfExtractRow): LucideIcon {
  switch (row.kind) {
    case "animation":
      return Clapperboard;
    case "part":
      return Box;
    case "material":
      return Palette;
    case "morph":
      return ScanFace;
    case "light":
      return Lightbulb;
    case "camera":
      return Camera;
    default:
      return Sparkles;
  }
}
