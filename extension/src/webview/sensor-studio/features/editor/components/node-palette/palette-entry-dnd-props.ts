import type { DragEvent } from "react";
import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import { setPaletteCatalogDragData } from "./palette-catalog-drag";

/** Spread onto palette `<button>` rows for drag-to-canvas. */
export function paletteEntryDnDProps(entry: NodeCatalogEntry): {
  draggable: boolean;
  onDragStart: (e: DragEvent<HTMLButtonElement>) => void;
} {
  return {
    draggable: true,
    onDragStart: (e: DragEvent<HTMLButtonElement>) => {
      setPaletteCatalogDragData(e.dataTransfer, entry.id);
    },
  };
}
