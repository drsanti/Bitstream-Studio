/** Custom MIME for palette → canvas drops (JSON body). */
export const PALETTE_CATALOG_DRAG_MIME = "application/sensor-studio-catalog-node";

export type PaletteCatalogDragPayload = {
  catalogNodeId: string;
};

export function setPaletteCatalogDragData(transfer: DataTransfer, catalogNodeId: string): void {
  const payload: PaletteCatalogDragPayload = { catalogNodeId };
  transfer.setData(PALETTE_CATALOG_DRAG_MIME, JSON.stringify(payload));
  transfer.effectAllowed = "copy";
}

export function parsePaletteCatalogDragData(transfer: DataTransfer): string | null {
  const raw = transfer.getData(PALETTE_CATALOG_DRAG_MIME);
  if (raw.length === 0) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as PaletteCatalogDragPayload;
    return typeof parsed.catalogNodeId === "string" && parsed.catalogNodeId.length > 0
      ? parsed.catalogNodeId
      : null;
  } catch {
    return null;
  }
}
