import type { StudioNodeAssetFile } from "../../subgraphs/node-library/studio-node-asset-file";

export const STUDIO_NODE_GROUP_ASSET_DRAG_MIME =
  "application/x-ternion-sensor-studio-node-group-asset+json";

export type StudioNodeGroupAssetDragPayloadV1 = {
  v: 1;
  dragKind: "nodeAsset";
  assetId: string;
  label: string;
};

export function setStudioNodeGroupAssetDragData(
  transfer: DataTransfer,
  asset: StudioNodeAssetFile,
): void {
  const payload: StudioNodeGroupAssetDragPayloadV1 = {
    v: 1,
    dragKind: "nodeAsset",
    assetId: asset.meta.id,
    label: asset.meta.name,
  };
  transfer.setData(STUDIO_NODE_GROUP_ASSET_DRAG_MIME, JSON.stringify(payload));
  transfer.effectAllowed = "copy";
}

export function parseStudioNodeGroupAssetDragData(
  transfer: DataTransfer,
): StudioNodeGroupAssetDragPayloadV1 | null {
  const raw = transfer.getData(STUDIO_NODE_GROUP_ASSET_DRAG_MIME);
  if (raw.length === 0) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as StudioNodeGroupAssetDragPayloadV1;
    if (parsed?.v !== 1 || parsed.dragKind !== "nodeAsset") {
      return null;
    }
    if (typeof parsed.assetId !== "string" || parsed.assetId.trim().length === 0) {
      return null;
    }
    if (typeof parsed.label !== "string" || parsed.label.trim().length === 0) {
      return null;
    }
    return {
      v: 1,
      dragKind: "nodeAsset",
      assetId: parsed.assetId.trim(),
      label: parsed.label.trim(),
    };
  } catch {
    return null;
  }
}
