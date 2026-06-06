/** Custom MIME for Asset Browser model row → flow canvas drops. */
export const STUDIO_ASSET_DRAG_MIME = "application/x-ternion-studio-asset+v1";

export type StudioAssetDragPayloadV1 = {
  v: 1;
  studioAssetId: string;
  label: string;
};

export function setStudioAssetDragData(
  transfer: DataTransfer,
  payload: Pick<StudioAssetDragPayloadV1, "studioAssetId" | "label">,
): void {
  const body: StudioAssetDragPayloadV1 = {
    v: 1,
    studioAssetId: payload.studioAssetId.trim(),
    label: payload.label.trim(),
  };
  if (body.studioAssetId.length === 0) {
    return;
  }
  transfer.setData(STUDIO_ASSET_DRAG_MIME, JSON.stringify(body));
  // Fallback for hosts that strip custom MIME types on drop.
  transfer.setData("text/plain", body.studioAssetId);
  transfer.effectAllowed = "copy";
}

export function parseStudioAssetDragData(
  transfer: DataTransfer,
): StudioAssetDragPayloadV1 | null {
  const raw = transfer.getData(STUDIO_ASSET_DRAG_MIME);
  if (raw.length === 0) {
    const plain = transfer.getData("text/plain").trim();
    if (plain.length === 0) {
      return null;
    }
    return { v: 1, studioAssetId: plain, label: plain };
  }
  try {
    const parsed = JSON.parse(raw) as StudioAssetDragPayloadV1;
    if (parsed.v !== 1) {
      return null;
    }
    const studioAssetId =
      typeof parsed.studioAssetId === "string" ? parsed.studioAssetId.trim() : "";
    const label = typeof parsed.label === "string" ? parsed.label.trim() : "";
    if (studioAssetId.length === 0) {
      return null;
    }
    return { v: 1, studioAssetId, label: label.length > 0 ? label : studioAssetId };
  } catch {
    return null;
  }
}
