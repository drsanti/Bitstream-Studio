import { describe, expect, test } from "vitest";
import {
  isLegacyRobotPackModelUrl,
  migrateLegacyPackModelInDefaultConfig,
  migrateLegacyPackModelUrl,
} from "../../src/webview/sensor-studio/persistence/migrate-legacy-pack-model";

describe("migrate-legacy-pack-model", () => {
  test("detects robot pack path", () => {
    expect(isLegacyRobotPackModelUrl("models/robot-4th-project/robot-4th-project.glb")).toBe(
      true,
    );
  });

  test("rewrites robot URL to PSoC E84", () => {
    expect(migrateLegacyPackModelUrl("models/robot-4th-project/robot-4th-project.glb")).toBe(
      "models/psoc-e84-ai/psoc-e84-ai.glb",
    );
  });

  test("migrates model-select defaultConfig", () => {
    const next = migrateLegacyPackModelInDefaultConfig(
      {
        selectedStudioAssetId: "model.robot-4th-project",
        selectedModelUrl: "models/robot-4th-project/robot-4th-project.glb",
      },
      "model-select",
    );
    expect(next.selectedStudioAssetId).toBe("model.psoc-e84.default");
    expect(next.selectedModelUrl).toBe("models/psoc-e84-ai/psoc-e84-ai.glb");
  });

  test("migrates scene3d model url on model-viewer", () => {
    const next = migrateLegacyPackModelInDefaultConfig(
      {
        scene3d: {
          version: 1,
          model: {
            url: "models/robot-4th-project/robot-4th-project.glb",
            studioAssetId: "model.robot-4th-project",
          },
        },
      },
      "model-viewer",
    );
    const scene3d = next.scene3d as { model: { url: string; studioAssetId: string } };
    expect(scene3d.model.url).toBe("models/psoc-e84-ai/psoc-e84-ai.glb");
    expect(scene3d.model.studioAssetId).toBe("model.psoc-e84.default");
  });

  test("returns empty object when defaultConfig is missing", () => {
    expect(migrateLegacyPackModelInDefaultConfig(undefined, "model-viewer")).toEqual({});
    expect(migrateLegacyPackModelInDefaultConfig(null, "model-select")).toEqual({});
  });
});
