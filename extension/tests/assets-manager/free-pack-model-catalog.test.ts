import { describe, expect, test } from "vitest";
import {
  FREE_PACK_MODEL_FOLDER_IDS,
  freePackModelRelativePath,
  freePackModelStudioAssetId,
} from "../../src/webview/assets-manager/registry/free-pack-model-catalog";

describe("free-pack-model-catalog", () => {
  test("matches upstream model folder count", () => {
    expect(FREE_PACK_MODEL_FOLDER_IDS).toHaveLength(9);
    expect(FREE_PACK_MODEL_FOLDER_IDS).not.toContain("robot-4th-project");
    expect(FREE_PACK_MODEL_FOLDER_IDS).toContain("psoc-e84-ai");
    expect(FREE_PACK_MODEL_FOLDER_IDS).toContain("tesa-drone");
  });

  test("relative path convention", () => {
    expect(freePackModelRelativePath("tesa-drone")).toBe(
      "models/tesa-drone/tesa-drone.glb",
    );
  });

  test("psoc default asset id", () => {
    expect(freePackModelStudioAssetId("psoc-e84-ai")).toBe("model.psoc-e84.default");
    expect(freePackModelStudioAssetId("robot-arm")).toBe("model.robot-arm");
  });
});
