import {
  DEFAULT_STUDIO_PACK_MODEL_ASSET_ID,
  DEFAULT_STUDIO_PACK_MODEL_RELATIVE_PATH,
} from "../../assets-manager/registry/default-studio-pack-model";

/** Removed from ternion-3d-assets-free; rewrite old saves to the pack default. */
const LEGACY_ROBOT_ASSET_ID = "model.robot-4th-project";
const LEGACY_ROBOT_RELATIVE_PATH = "models/robot-4th-project/robot-4th-project.glb";

export function isLegacyRobotPackModelUrl(url: unknown): boolean {
  if (typeof url !== "string") {
    return false;
  }
  const t = url.trim().toLowerCase();
  return t.includes("robot-4th-project");
}

export function isLegacyRobotPackAssetId(id: unknown): boolean {
  return id === LEGACY_ROBOT_ASSET_ID;
}

/** Rewrite demo-era robot pack refs to the canonical PSoC E84 pack model. */
export function migrateLegacyPackModelUrl(url: string): string {
  if (!isLegacyRobotPackModelUrl(url)) {
    return url;
  }
  return DEFAULT_STUDIO_PACK_MODEL_RELATIVE_PATH;
}

export function migrateLegacyPackModelAssetId(id: string): string {
  if (!isLegacyRobotPackAssetId(id)) {
    return id;
  }
  return DEFAULT_STUDIO_PACK_MODEL_ASSET_ID;
}

function migrateScene3dModelBlock(model: Record<string, unknown>): Record<string, unknown> {
  let next = model;
  const url = model.url;
  if (typeof url === "string" && isLegacyRobotPackModelUrl(url)) {
    next = {
      ...next,
      url: DEFAULT_STUDIO_PACK_MODEL_RELATIVE_PATH,
      studioAssetId: DEFAULT_STUDIO_PACK_MODEL_ASSET_ID,
    };
  } else if (isLegacyRobotPackAssetId(model.studioAssetId)) {
    next = {
      ...next,
      studioAssetId: DEFAULT_STUDIO_PACK_MODEL_ASSET_ID,
      url:
        typeof url === "string" && url.trim().length > 0
          ? migrateLegacyPackModelUrl(url)
          : DEFAULT_STUDIO_PACK_MODEL_RELATIVE_PATH,
    };
  }
  return next;
}

/** Patch `defaultConfig` on flow nodes that store pack model paths or scene3d URLs. */
export function migrateLegacyPackModelInDefaultConfig(
  dc: Record<string, unknown> | null | undefined,
  catalogNodeId: string,
): Record<string, unknown> {
  if (dc == null || typeof dc !== "object" || Array.isArray(dc)) {
    return {};
  }

  let next = dc;
  let changed = false;

  if (catalogNodeId === "model-select") {
    const url = dc.selectedModelUrl;
    const assetId = dc.selectedStudioAssetId;
    if (isLegacyRobotPackModelUrl(url) || isLegacyRobotPackAssetId(assetId)) {
      next = {
        ...next,
        selectedStudioAssetId: DEFAULT_STUDIO_PACK_MODEL_ASSET_ID,
        selectedModelUrl:
          typeof url === "string" && url.trim().length > 0 && !isLegacyRobotPackModelUrl(url)
            ? url
            : DEFAULT_STUDIO_PACK_MODEL_RELATIVE_PATH,
      };
      changed = true;
    }
  }

  const scene3d = dc.scene3d;
  if (scene3d != null && typeof scene3d === "object" && !Array.isArray(scene3d)) {
    const s = scene3d as Record<string, unknown>;
    const model = s.model;
    if (model != null && typeof model === "object" && !Array.isArray(model)) {
      const migratedModel = migrateScene3dModelBlock(model as Record<string, unknown>);
      if (migratedModel !== model) {
        next = { ...next, scene3d: { ...s, model: migratedModel } };
        changed = true;
      }
    }
  }

  return changed ? next : dc;
}
