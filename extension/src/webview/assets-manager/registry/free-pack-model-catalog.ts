/**
 * Model folder ids from **ternion-3d-assets-free** `assets/models/manifest.json`.
 * Browse: https://github.com/drsanti/ternion-3d-assets-free/tree/main/assets/models
 *
 * Keep {@link FREE_PACK_MODEL_FOLDER_IDS} in sync when the upstream list changes;
 * run `npm run sync:studio-manifest-models` to refresh studio-asset-manifest model rows.
 */
import folderIdsJson from "./free-pack-model-ids.v1.json";

const ONLINE_MODELS_BASE =
  "https://raw.githubusercontent.com/drsanti/ternion-3d-assets-free/main/assets/models";

export const FREE_PACK_MODEL_FOLDER_IDS = folderIdsJson as readonly string[];

export function freePackModelRelativePath(folderId: string): string {
  return `models/${folderId}/${folderId}.glb`;
}

export function freePackModelOnlineFallbackUrl(folderId: string): string {
  return `${ONLINE_MODELS_BASE}/${folderId}/${folderId}.glb`;
}

export function freePackModelStudioAssetId(folderId: string): string {
  return folderId === "psoc-e84-ai" ? "model.psoc-e84.default" : `model.${folderId}`;
}

const FREE_PACK_MODEL_LABELS: Record<string, string> = {
  "abb-robot-arm": "ABB robot arm",
  "car-cam-physics": "Car + camera (physics)",
  "healtcare-gateway": "Healthcare gateway",
  "plc-traninig-kit": "PLC training kit",
  "psoc-e84-ai": "PSoC E84 (AI board)",
  "psoc-e84-ai-board": "PSoC E84 AI board (variant)",
  "robot-4w": "Robot 4-wheel",
  "robot-arm": "Robot arm",
  "tesa-drone": "TESA drone",
};

export function freePackModelLabel(folderId: string): string {
  return FREE_PACK_MODEL_LABELS[folderId] ?? folderId;
}
