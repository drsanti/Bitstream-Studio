import { PSOC_E84_GLB_RELATIVE_PATH } from "../../../bitstream-app/components/3d-rotation/shared/rotationPreviewConstants";
import {
  defaultScene3DConfig,
  persistScene3DConfig,
  type Scene3DConfigV1,
} from "../scene3d/scene3d-config";
import { coerceScene3DConfigV1 } from "../scene3d/scene3d-config";

/** Scene Output / Stage workbench — floor grid off by default. */
export const STAGE_DEFAULT_SHOW_GRID = false;

/** Free-pack cubemap folder `park` — manifest id `env.cubemap.park`. */
export const STAGE_DEFAULT_ENVIRONMENT_ASSET_ID = "env.cubemap.park";

/** Legacy cubemap ids superseded by Park for Stage / Environment defaults. */
const LEGACY_ENVIRONMENT_ASSET_IDS = new Set([
  "env.cubemap.yokohama",
  "env.cubemap.yokohama2",
  "env.cubemap.yokohama3",
  "env.cubemap.storforsen3",
  "env.cubemap.storforsen",
  "env.cubemap.storforsen4",
]);

export function isLegacyStageEnvironmentAssetId(studioAssetId: unknown): boolean {
  if (studioAssetId == null) {
    return true;
  }
  if (typeof studioAssetId !== "string") {
    return false;
  }
  const trimmed = studioAssetId.trim();
  if (trimmed.length === 0) {
    return true;
  }
  return LEGACY_ENVIRONMENT_ASSET_IDS.has(trimmed);
}

/**
 * `StudioSceneViewport` reads `scene3d.helpers.grid.enabled` (not `showGrid` alone).
 * Ensures Park cubemap when no environment wire is connected.
 */
export function applyStageScene3dPresentation(
  scene3d: Scene3DConfigV1,
  options: { showGrid: boolean },
): Scene3DConfigV1 {
  const { showGrid } = options;
  let environment = scene3d.environment;
  if (isLegacyStageEnvironmentAssetId(environment.studioAssetId)) {
    environment = {
      ...environment,
      studioAssetId: STAGE_DEFAULT_ENVIRONMENT_ASSET_ID,
      useCubemapIbl: true,
      showBackgroundTexture: true,
    };
  }
  return {
    ...scene3d,
    environment,
    helpers: {
      ...scene3d.helpers,
      grid: {
        ...scene3d.helpers.grid,
        enabled: showGrid,
      },
    },
  };
}

/** Default `scene3d` for new **Scene Output** nodes (grid off, Park cubemap IBL). */
export function stageSceneOutputDefaultScene3d(): Scene3DConfigV1 {
  const base = defaultScene3DConfig();
  return applyStageScene3dPresentation(
    {
      ...base,
      model: { ...base.model, url: PSOC_E84_GLB_RELATIVE_PATH },
      environment: {
        ...base.environment,
        studioAssetId: STAGE_DEFAULT_ENVIRONMENT_ASSET_ID,
        useCubemapIbl: true,
        showBackgroundTexture: true,
      },
    },
    { showGrid: STAGE_DEFAULT_SHOW_GRID },
  );
}

/** Migrate persisted **scene-output** / **environment** nodes to current Stage defaults. */
export function migrateStageSceneFlowNode(node: {
  data: { nodeId: string; defaultConfig: Record<string, unknown> };
}): { data: { nodeId: string; defaultConfig: Record<string, unknown> } } | null {
  const { nodeId } = node.data;
  const dc = { ...node.data.defaultConfig };

  if (nodeId === "scene-output") {
    let changed = false;
    if (dc.showGrid !== STAGE_DEFAULT_SHOW_GRID) {
      dc.showGrid = STAGE_DEFAULT_SHOW_GRID;
      changed = true;
    }
    const prevSerialized =
      dc.scene3d != null
        ? persistScene3DConfig(coerceScene3DConfigV1(dc.scene3d))
        : null;
    const nextSerialized = persistScene3DConfig(
      dc.scene3d != null
        ? applyStageScene3dPresentation(coerceScene3DConfigV1(dc.scene3d), {
            showGrid: STAGE_DEFAULT_SHOW_GRID,
          })
        : stageSceneOutputDefaultScene3d(),
    );
    if (JSON.stringify(prevSerialized) !== JSON.stringify(nextSerialized)) {
      dc.scene3d = nextSerialized;
      changed = true;
    }
    return changed ? { data: { ...node.data, defaultConfig: dc } } : null;
  }

  if (nodeId === "environment") {
    const sid = dc.studioAssetId;
    if (!isLegacyStageEnvironmentAssetId(sid)) {
      return null;
    }
    return {
      data: {
        ...node.data,
        defaultConfig: {
          ...dc,
          ...stageEnvironmentNodeDefaultConfig(),
        },
      },
    };
  }

  return null;
}

/** Environment node defaults when spawned for Stage demos (Park cubemap). */
export function stageEnvironmentNodeDefaultConfig(): Record<string, unknown> {
  return {
    version: 1,
    presetIndex: 0,
    studioAssetId: STAGE_DEFAULT_ENVIRONMENT_ASSET_ID,
    showBackgroundTexture: true,
    useCubemapIbl: true,
    iblStrength: 1,
    iblOffStrengthFrac: 0.45,
    yawDeg: 0,
    backgroundColorHex: "#09090b",
    inputSocketVisibility: {},
  };
}
