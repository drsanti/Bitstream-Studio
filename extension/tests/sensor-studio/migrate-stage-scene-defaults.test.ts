import { describe, expect, test } from "vitest";
import {
  migrateStageSceneFlowNode,
  STAGE_DEFAULT_ENVIRONMENT_ASSET_ID,
  STAGE_DEFAULT_SHOW_GRID,
} from "../../src/webview/sensor-studio/core/stage/stage-scene-defaults";
import { defaultScene3DConfig } from "../../src/webview/sensor-studio/core/scene3d/scene3d-config";

describe("migrateStageSceneFlowNode", () => {
  test("migrates scene-output grid and legacy yokohama env to Park", () => {
    const scene3d = defaultScene3DConfig();
    scene3d.helpers.grid.enabled = true;
    scene3d.environment.studioAssetId = "env.cubemap.yokohama";
    const migrated = migrateStageSceneFlowNode({
      data: {
        nodeId: "scene-output",
        defaultConfig: { showGrid: true, scene3d },
      },
    });
    expect(migrated).not.toBeNull();
    const dc = migrated!.data.defaultConfig as Record<string, unknown>;
    expect(dc.showGrid).toBe(STAGE_DEFAULT_SHOW_GRID);
    const next = dc.scene3d as ReturnType<typeof defaultScene3DConfig>;
    expect(next.helpers.grid.enabled).toBe(false);
    expect(next.environment.studioAssetId).toBe(STAGE_DEFAULT_ENVIRONMENT_ASSET_ID);
  });

  test("migrates environment node with empty studioAssetId to Park", () => {
    const migrated = migrateStageSceneFlowNode({
      data: {
        nodeId: "environment",
        defaultConfig: { presetIndex: 0, studioAssetId: "" },
      },
    });
    expect(migrated).not.toBeNull();
    expect(migrated!.data.defaultConfig.studioAssetId).toBe(
      STAGE_DEFAULT_ENVIRONMENT_ASSET_ID,
    );
  });

  test("leaves non-legacy environment node unchanged", () => {
    const migrated = migrateStageSceneFlowNode({
      data: {
        nodeId: "environment",
        defaultConfig: {
          presetIndex: 0,
          studioAssetId: "env.cubemap.autumn_forest",
        },
      },
    });
    expect(migrated).toBeNull();
  });
});
