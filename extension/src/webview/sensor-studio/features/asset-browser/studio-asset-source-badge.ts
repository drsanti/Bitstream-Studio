import type { StudioAssetSource } from "./studio-asset.types";

export function studioAssetSourceBadgeClasses(source: StudioAssetSource): string {
  switch (source) {
    case "bundled":
      return "border-violet-500/35 bg-violet-950/40 text-violet-200/90";
    case "pack":
      return "border-emerald-500/35 bg-emerald-950/40 text-emerald-200/90";
    case "downloaded":
      return "border-sky-500/35 bg-sky-950/40 text-sky-200/90";
    case "external":
      return "border-amber-500/35 bg-amber-950/40 text-amber-200/90";
    default:
      return "border-zinc-600 bg-zinc-900 text-zinc-400";
  }
}
