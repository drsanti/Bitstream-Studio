import { useMemo } from "react";
import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import { useBitstreamLiveStore } from "../../../../../bitstream-app/state/bitstreamLive.store";
import { computePalettePreview, type PalettePreview } from "./palette-live-preview";
import { usePaletteLiveTick } from "./PaletteLiveTickContext";

export function usePaletteEntryPreview(entry: NodeCatalogEntry): PalettePreview {
  const latestByHint = useBitstreamLiveStore((s) => s.latestByHint);
  const tick = usePaletteLiveTick();
  return useMemo(
    () => computePalettePreview(entry, latestByHint, Date.now()),
    [entry, latestByHint, tick],
  );
}
